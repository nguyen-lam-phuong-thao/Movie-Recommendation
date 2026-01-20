from __future__ import annotations

import argparse
from pathlib import Path

import pandas as pd

from .recommender_core import FilterParams, MovieRecommender, parse_list_arg
from . import settings


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Return movie recommendations using a FAISS index.")
    parser.add_argument("--embeddings", type=Path, default=settings.EMBEDDINGS_PATH)
    parser.add_argument("--metadata", type=Path, default=settings.METADATA_PATH)
    parser.add_argument("--index", type=Path, default=settings.INDEX_PATH)

    parser.add_argument("--seed-ids", type=int, nargs="+", required=True, help="Seed vector_ids (1-3 recommended).")

    parser.add_argument("--platforms", help="Comma-separated platforms (e.g., 'Netflix,Disney+').")
    parser.add_argument("--types", help="Comma-separated types (e.g., 'Movie,TV Show').")
    parser.add_argument("--countries", help="Comma-separated countries (substring match).")
    parser.add_argument("--min-year", type=int, help="Minimum release year.")
    parser.add_argument("--max-year", type=int, help="Maximum release year.")

    parser.add_argument("--top-k", type=int, default=5)
    parser.add_argument("--search-k", type=int, default=300, help="How many neighbours to fetch before filtering.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    recommender = MovieRecommender(
        embeddings_path=args.embeddings,
        metadata_path=args.metadata,
        index_path=args.index,
    )

    filters = FilterParams(
        platform=parse_list_arg(args.platforms),
        type=parse_list_arg(args.types),
        country=parse_list_arg(args.countries),
        min_year=args.min_year,
        max_year=args.max_year,
    )

    recs = recommender.recommend(
        seed_ids=args.seed_ids,
        filters=filters,
        top_k=args.top_k,
        search_k=args.search_k,
    )

    cols = [c for c in ["vector_id", "score", "title", "platform", "type", "release_year", "genre_list"] if c in recs]
    with pd.option_context("display.max_colwidth", 120):
        print(recs[cols])


if __name__ == "__main__":
    main()
