export type TitleResponse = {
  vector_id: number;
  title: string;
  platform: string;
  type: string;
  release_year: number;
  genre_list: string[];
  country?: string | null;
  description?: string | null;
};

export type FilterState = {
  platforms: string[];
  types: string[];
  countries: string[];
  minYear: number | null;
  maxYear: number | null;
};

export type RecommendRequest = {
  seed_ids: number[];
  filters: {
    platforms: string[];
    types: string[];
    countries: string[];
    min_year: number | null;
    max_year: number | null;
  } | null;
  top_k: number;
};
