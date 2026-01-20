"""
Core reusable recommender utilities shared by CLI and FastAPI layers.
"""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, List, Sequence

import numpy as np
import pandas as pd

from . import settings

try:
    import faiss
except ImportError as exc:  # pragma: no cover
    raise SystemExit(
        "FAISS is required. Install it with `pip install faiss-cpu` (or faiss-gpu)."
    ) from exc


def normalize_genre_list(value: Iterable[str] | str | None) -> List[str]:
    if value is None:
        return []
    if isinstance(value, str):
        return [item.strip() for item in value.split(",") if item.strip()]
    return [str(item).strip() for item in value if str(item).strip()]


@dataclass
class FilterParams:
    platform: Sequence[str] | None = None
    type: Sequence[str] | None = None
    country: Sequence[str] | None = None
    min_year: int | None = None
    max_year: int | None = None


def parse_list_arg(value: str | None) -> List[str] | None:
    if not value:
        return None
    parts = [part.strip() for part in value.split(",")]
    cleaned = [part for part in parts if part]
    return cleaned or None


class MovieRecommender:
    """
    Wraps embeddings, metadata, and FAISS index for both CLI and API layers.
    """

    def __init__(
        self,
        embeddings_path: Path = settings.EMBEDDINGS_PATH,
        metadata_path: Path = settings.METADATA_PATH,
        index_path: Path = settings.INDEX_PATH,
    ) -> None:
        if not embeddings_path.exists():
            raise FileNotFoundError(f"Embeddings not found: {embeddings_path}")
        if not metadata_path.exists():
            raise FileNotFoundError(f"Metadata not found: {metadata_path}")
        if not index_path.exists():
            raise FileNotFoundError(f"FAISS index not found: {index_path}")

        self.embeddings = np.load(embeddings_path).astype("float32", copy=False)
        if self.embeddings.ndim != 2:
            raise ValueError("Embeddings must be a 2-D array.")

        self.metadata = pd.read_parquet(metadata_path).reset_index(drop=True)
        if "vector_id" not in self.metadata.columns:
            raise ValueError("Metadata must contain 'vector_id'.")
        if len(self.metadata) != self.embeddings.shape[0]:
            raise ValueError(
                f"Mismatch metadata rows={len(self.metadata)} vs embeddings={self.embeddings.shape[0]}."
            )

        self.index = faiss.read_index(str(index_path))

    def list_titles(self, filters: FilterParams | None = None) -> pd.DataFrame:
        df = self.apply_filters(filters)
        df = df.copy()
        df["genre_list"] = df["genre_list"].apply(normalize_genre_list)
        return df

    def apply_filters(self, filters: FilterParams | None) -> pd.DataFrame:
        df = self.metadata
        if not filters:
            return df.copy()

        mask = pd.Series(True, index=df.index)
        if filters.platform:
            platforms = {p.lower() for p in filters.platform}
            mask &= df["platform"].fillna("").str.lower().isin(platforms)
        if filters.type:
            allowed_types = {t.lower() for t in filters.type}
            mask &= df["type"].fillna("").str.lower().isin(allowed_types)
        if filters.country:
            targets = {c.lower() for c in filters.country}
            mask &= df["country"].fillna("").str.lower().apply(
                lambda countries: any(target in countries for target in targets)
            )
        if filters.min_year is not None:
            mask &= df["release_year"].fillna(0) >= filters.min_year
        if filters.max_year is not None:
            mask &= df["release_year"].fillna(0) <= filters.max_year

        filtered = df[mask].copy()
        if filtered.empty:
            raise ValueError("No titles match the selected filters.")
        return filtered

    def _average_seed_vector(self, seed_ids: Sequence[int]) -> np.ndarray:
        seed_ids_arr = np.array(seed_ids, dtype=int)
        if (seed_ids_arr < 0).any() or (seed_ids_arr >= self.embeddings.shape[0]).any():
            raise ValueError("One or more seed_ids are out of range.")

        vectors = self.embeddings[seed_ids_arr]
        mean_vec = vectors.mean(axis=0)
        norm = np.linalg.norm(mean_vec)
        if norm == 0:
            raise ValueError("Seed vectors collapsed to zero; check embeddings.")
        return (mean_vec / norm).astype("float32")

    def recommend(
        self,
        seed_ids: Sequence[int],
        filters: FilterParams | None,
        top_k: int,
        search_k: int,
    ) -> pd.DataFrame:
        filtered = self.apply_filters(filters)
        filtered_by_id = filtered.set_index("vector_id")

        query = self._average_seed_vector(seed_ids)
        k = min(search_k, self.embeddings.shape[0])
        scores, ids = self.index.search(query[np.newaxis, :], k)
        ids = ids[0]
        scores = scores[0]

        seed_set = set(int(x) for x in seed_ids)
        results = []

        for vid, score in zip(ids, scores):
            vid_int = int(vid)
            if vid_int in seed_set:
                continue
            if vid_int not in filtered_by_id.index:
                continue

            row = filtered_by_id.loc[vid_int].to_dict()
            row["vector_id"] = vid_int
            row["score"] = float(score)
            row["genre_list"] = normalize_genre_list(row.get("genre_list"))
            results.append(row)
            if len(results) >= top_k:
                break

        if not results:
            raise ValueError("No recommendations found. Try relaxing filters.")

        return pd.DataFrame(results)
