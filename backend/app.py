"""
FastAPI application exposing /api/titles and /api/recommend endpoints.
"""
from __future__ import annotations

from typing import List

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from .recommender_core import (
    FilterParams,
    MovieRecommender,
    normalize_genre_list,
    parse_list_arg,
)
from .schemas import FilterPayload, RecommendRequest, TitleResponse


app = FastAPI(title="Movie Recommender API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

recommender = MovieRecommender()


def to_filter_params(payload: FilterPayload | None) -> FilterParams | None:
    if payload is None:
        return None
    return FilterParams(
        platform=payload.platforms or None,
        type=payload.types or None,
        country=payload.countries or None,
        min_year=payload.min_year,
        max_year=payload.max_year,
    )


def serialize_titles(df) -> List[TitleResponse]: #return json to dataframe
    return [
        TitleResponse(
            vector_id=int(row.vector_id),
            title=row.title,
            platform=row.platform,
            type=row.type,
            release_year=int(row.release_year),
            genre_list=normalize_genre_list(row.genre_list),
            country=row.country,
            description=row.description,
        )
        for _, row in df.iterrows()
    ]


@app.get("/api/titles", response_model=List[TitleResponse])
def list_titles(
    platforms: str | None = Query(default=None, description="Comma separated platforms"),
    types: str | None = Query(default=None, description="Comma separated types"),
    countries: str | None = Query(default=None, description="Comma separated countries"),
    minYear: int | None = Query(default=None),
    maxYear: int | None = Query(default=None),
):
    filters = FilterParams(
        platform=parse_list_arg(platforms),
        type=parse_list_arg(types),
        country=parse_list_arg(countries),
        min_year=minYear,
        max_year=maxYear,
    )
    try:
        df = recommender.list_titles(filters)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return serialize_titles(df)


@app.post("/api/recommend", response_model=List[TitleResponse])
def recommend(payload: RecommendRequest):
    filters = to_filter_params(payload.filters)
    search_k = max(200, payload.top_k * 50)
    try:
        df = recommender.recommend(
            seed_ids=payload.seed_ids,
            filters=filters,
            top_k=payload.top_k,
            search_k=search_k,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return serialize_titles(df)
