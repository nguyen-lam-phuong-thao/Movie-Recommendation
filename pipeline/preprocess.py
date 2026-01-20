"""
Preprocess Netflix & Disney+ title metadata into a unified clean dataset.
"""
from __future__ import annotations

from pathlib import Path
from typing import Iterable, List, Tuple

import pandas as pd

DATA_DIR = Path(__file__).resolve().parent
NETFLIX_CSV = DATA_DIR / "Movie_DA/netflix_titles.csv"
DISNEY_CSV = DATA_DIR / "Movie_DA/disney_plus_titles.csv"
OUTPUT_PARQUET = DATA_DIR / "artifacts/titles_clean.parquet"
OUTPUT_CSV = DATA_DIR / "artifacts/titles_clean.csv"

COUNTRY_ALIAS = {
    "united states": "USA",
    "united kingdom": "UK",
    "south korea": "S. Korea",
}

TEXT_COLUMNS = ["title", "director", "cast", "description", "listed_in", "country"]


def load_raw() -> pd.DataFrame:
    netflix = pd.read_csv(NETFLIX_CSV)
    disney = pd.read_csv(DISNEY_CSV)
    netflix["platform"] = "Netflix"
    disney["platform"] = "Disney+"
    return pd.concat([disney, netflix], ignore_index=True)


def clean_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()

    df["director"] = df["director"].fillna("No Data")
    df["cast"] = df["cast"].fillna("No Data")
    df["country"] = df["country"].fillna(df["country"].mode().iat[0])

    df = df.dropna(subset=["rating"])
    if "duration" in df.columns:
        df = df.dropna(subset=["duration"])

    df["date_added"] = (
        df["date_added"]
        .astype(str)
        .str.strip()
        .str.replace(r"\s+", " ", regex=True)
    )
    df["date_added"] = pd.to_datetime(
        df["date_added"], format="mixed", errors="coerce", dayfirst=True
    )
    df = df.dropna(subset=["date_added"])

    df["rating"] = df["rating"].fillna("NR")        
    df["duration"] = df["duration"].fillna("0")     

    normalize_text_columns(df, TEXT_COLUMNS)

    df["release_year"] = pd.to_numeric(df["release_year"], errors="coerce").astype("Int64")

    df["country_list"] = df["country"].apply(split_multi_values).apply(standardize_country)
    df["genre_list"] = df["listed_in"].apply(split_multi_values)

    df["duration_minutes"], df["seasons"] = zip(*df.apply(parse_duration, axis=1))
    df["search_text"] = df.apply(build_search_text, axis=1)

    return df


def normalize_text_columns(df: pd.DataFrame, columns: Iterable[str]) -> None:
    for col in columns:
        if col in df.columns:
            df[col] = (
                df[col]
                .astype(str)
                .str.strip()
                .str.replace(r"\s+", " ", regex=True)
                .str.lower()
            )


def split_multi_values(value: str) -> List[str]:
    if not value or value == "nan":
        return []
    return [item.strip() for item in value.split(",") if item.strip()]


def standardize_country(countries: List[str]) -> List[str]:
    return [COUNTRY_ALIAS.get(country, country.title()) for country in countries]


def parse_duration(row: pd.Series) -> Tuple[int | None, int | None]:
    duration = str(row.get("duration", "")).lower()
    digits = "".join(ch for ch in duration if ch.isdigit())
    if row.get("type", "").lower() == "movie":
        return (int(digits) if digits.isdigit() else None, None)
    return (None, int(digits) if digits.isdigit() else None)


def build_search_text(row: pd.Series) -> str:
    parts = [
        row.get("title"),
        row.get("description"),
        " ".join(row.get("genre_list", [])),
        row.get("cast"),
        row.get("platform"),
    ]
    return " ".join(part for part in parts  if part).strip()


def main() -> None:
    df_raw = load_raw()
    df_clean = clean_dataframe(df_raw)
    df_clean.to_parquet(OUTPUT_PARQUET, index=False)
    df_clean.to_csv(OUTPUT_CSV, index=False)
    print(f"Saved {len(df_clean):,} rows -> {OUTPUT_PARQUET.name} / {OUTPUT_CSV.name}")




if __name__ == "__main__":
    main()

# df = pd.read_parquet(OUTPUT_PARQUET)
# print(df.head())
# print(df.info())
# print(df.isnull().sum())             
# dupes = df.duplicated(subset=["title", "platform"])
# print("Duplicates:", dupes.sum())



















