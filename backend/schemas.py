"""
Pydantic request/response schemas for the FastAPI service.
"""
from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field


class FilterPayload(BaseModel):
    platforms: List[str] = Field(default_factory=list)
    types: List[str] = Field(default_factory=list)
    countries: List[str] = Field(default_factory=list)
    min_year: Optional[int] = None
    max_year: Optional[int] = None


class RecommendRequest(BaseModel):
    seed_ids: List[int]
    filters: FilterPayload
    top_k: int = Field(default=5, ge=1, le=50)


class TitleResponse(BaseModel):
    vector_id: int
    title: str
    platform: str
    type: str
    release_year: int
    genre_list: List[str]
    country: Optional[str] = None
    description: Optional[str] = None
