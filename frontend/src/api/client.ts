import type { FilterState, RecommendRequest, TitleResponse } from "../types";

const DEFAULT_BASE_URL = "http://127.0.0.1:8000";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || DEFAULT_BASE_URL;

const buildQueryParams = (filters: FilterState): string => {
  const params = new URLSearchParams();
  if (filters.platforms.length) {
    params.append("platforms", filters.platforms.join(","));
  }
  if (filters.types.length) {
    params.append("types", filters.types.join(","));
  }
  if (filters.countries.length) {
    params.append("countries", filters.countries.join(","));
  }
  if (typeof filters.minYear === "number") {
    params.append("minYear", String(filters.minYear));
  }
  if (typeof filters.maxYear === "number") {
    params.append("maxYear", String(filters.maxYear));
  }
  return params.toString();
};

const normalizeFiltersForRequest = (filters: FilterState) => {
  const payload = {
    platforms: filters.platforms,
    types: filters.types,
    countries: filters.countries,
    min_year: filters.minYear ?? null,
    max_year: filters.maxYear ?? null,
  } as const;

  const hasContent =
    payload.platforms.length ||
    payload.types.length ||
    payload.countries.length ||
    payload.min_year !== null ||
    payload.max_year !== null;

  return hasContent ? payload : null;
};

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (response.ok) {
    return response.json() as Promise<T>;
  }
  let detail = "Unexpected error";
  try {
    const data = await response.json();
    detail = data?.detail || detail;
  } catch (error) {
    detail = response.statusText || detail;
  }
  throw new Error(detail);
};

export const fetchTitles = async (filters: FilterState): Promise<TitleResponse[]> => {
  const query = buildQueryParams(filters);
  const url = query ? `${API_BASE_URL}/api/titles?${query}` : `${API_BASE_URL}/api/titles`;
  const response = await fetch(url);
  return handleResponse<TitleResponse[]>(response);
};

export const fetchRecommendations = async (
  seedIds: number[],
  filters: FilterState,
  topK: number
): Promise<TitleResponse[]> => {
  const body: RecommendRequest = {
    seed_ids: seedIds,
    filters: normalizeFiltersForRequest(filters),
    top_k: topK,
  };
  const response = await fetch(`${API_BASE_URL}/api/recommend`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return handleResponse<TitleResponse[]>(response);
};
