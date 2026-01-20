"""
Centralized paths and configuration for the backend modules.
"""
from __future__ import annotations

from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
ARTIFACTS_DIR = BASE_DIR / "artifacts"

EMBEDDINGS_PATH = ARTIFACTS_DIR / "title_embeddings.npy"
METADATA_PATH = ARTIFACTS_DIR / "titles_metadata.parquet"
INDEX_PATH = ARTIFACTS_DIR / "titles_faiss.index"
