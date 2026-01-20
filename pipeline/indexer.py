"""
Build a persistent FAISS (or numpy) index from the sentence embeddings generated
by embedder.py so downstream services can load the index instantly without
rebuilding it on every startup.
"""
from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

import numpy as np

try:
    import faiss

    FAISS_AVAILABLE = True
except ImportError:  # pragma: no cover
    faiss = None  # type: ignore
    FAISS_AVAILABLE = False


DATA_DIR = Path(__file__).resolve().parent
DEFAULT_EMBEDDINGS = DATA_DIR / "artifacts/title_embeddings.npy"
DEFAULT_INDEX = DATA_DIR / "artifacts/titles_faiss.index"
DEFAULT_MANIFEST = DATA_DIR / "artifacts/index_manifest.json"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Serialize the similarity index used by the movie recommender."
    )
    parser.add_argument(
        "--embeddings",
        type=Path,
        default=DEFAULT_EMBEDDINGS,
        help="Path to title_embeddings.npy produced by embedder.py.",
    )
    parser.add_argument(
        "--index-out",
        type=Path,
        default=DEFAULT_INDEX,
        help="Destination path for the serialized index (faiss index or .npy).",
    )
    parser.add_argument(
        "--manifest-out",
        type=Path,
        default=DEFAULT_MANIFEST,
        help="Path to store metadata (JSON) describing the generated index.",
    )
    parser.add_argument(
        "--backend",
        choices=["faiss", "numpy"],
        default="faiss",
        help="Index backend to build. Use 'numpy' if FAISS is unavailable.",
    )
    parser.add_argument(
        "--normalize",
        default=True,
        action=argparse.BooleanOptionalAction,
        help="Normalize embeddings before saving when using the numpy backend.",
    )
    return parser.parse_args()


def load_embeddings(path: Path) -> np.ndarray:
    if not path.exists():
        raise SystemExit(f"Embeddings file not found: {path}")
    arr = np.load(path)
    if arr.ndim != 2:
        raise SystemExit("Embeddings file must contain a 2-D array.")
    return arr.astype("float32", copy=False)


def ensure_dir(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)


def normalize_embeddings(embeddings: np.ndarray) -> np.ndarray:
    norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
    norms[norms == 0] = 1.0
    return embeddings / norms


def build_faiss_index(embeddings: np.ndarray):
    if not FAISS_AVAILABLE:
        raise SystemExit(
            "FAISS is not installed. Install faiss-cpu (or faiss-gpu) or use --backend numpy."
        )
    dim = embeddings.shape[1]
    index = faiss.IndexFlatIP(dim)  # type: ignore[attr-defined]
    faiss.normalize_L2(embeddings)  # type: ignore[attr-defined]
    index.add(embeddings)  # type: ignore[attr-defined]
    return index


def save_manifest(manifest_path: Path, payload: dict) -> None:
    ensure_dir(manifest_path)
    manifest_path.write_text(json.dumps(payload, indent=2))


def main() -> None:
    args = parse_args()
    embeddings = load_embeddings(args.embeddings)
    num_vectors, dim = embeddings.shape
    ensure_dir(args.index_out)

    if args.backend == "faiss":
        index = build_faiss_index(embeddings.copy())
        faiss.write_index(index, str(args.index_out))  # tạo file titles_faiss.index
        backend_info = {
            "backend": "faiss",
            "index_file": str(args.index_out),
        }
    else:
        vectors = embeddings.copy()
        if args.normalize:
            vectors = normalize_embeddings(vectors)
        np.save(args.index_out, vectors.astype("float32"))
        backend_info = {
            "backend": "numpy",
            "index_file": str(args.index_out),
            "normalized": args.normalize,
        }

    manifest = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source_embeddings": str(args.embeddings),
        "num_vectors": int(num_vectors),
        "vector_dim": int(dim),
        **backend_info,
    }
    save_manifest(args.manifest_out, manifest)

    print(f"Index backend: {backend_info['backend']}")
    print(f"Saved index -> {args.index_out}")
    print(f"Saved manifest -> {args.manifest_out}")


if __name__ == "__main__":
    main()
