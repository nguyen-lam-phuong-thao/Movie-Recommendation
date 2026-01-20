import { create } from "zustand";
import { persist, createJSONStorage, StateStorage } from "zustand/middleware";
import type { FilterState, TitleResponse } from "../types";

export const defaultFilters: FilterState = {
  platforms: [],
  types: [],
  countries: [],
  minYear: null,
  maxYear: null,
};

type AppState = {
  filters: FilterState;
  filteredTitles: TitleResponse[];
  selectedSeedIds: number[];
  recommendations: TitleResponse[];
  setFilters: (filters: FilterState) => void;
  setFilteredTitles: (titles: TitleResponse[]) => void;
  toggleSeed: (id: number) => void;
  clearSeeds: () => void;
  setRecommendations: (titles: TitleResponse[]) => void;
  resetAll: () => void;
};

const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

const storage = createJSONStorage(() => {
  if (typeof window === "undefined") {
    return noopStorage;
  }
  return sessionStorage;
});

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      filters: defaultFilters,
      filteredTitles: [],
      selectedSeedIds: [],
      recommendations: [],
      setFilters: (filters) => set({ filters }),
      setFilteredTitles: (titles) => set({ filteredTitles: titles }),
      toggleSeed: (id) =>
        set((state) => {
          const exists = state.selectedSeedIds.includes(id);
          const selectedSeedIds = exists
            ? state.selectedSeedIds.filter((seed) => seed !== id)
            : [...state.selectedSeedIds, id];
          return { selectedSeedIds };
        }),
      clearSeeds: () => set({ selectedSeedIds: [] }),
      setRecommendations: (titles) => set({ recommendations: titles }),
      resetAll: () =>
        set({
          filters: defaultFilters,
          filteredTitles: [],
          selectedSeedIds: [],
          recommendations: [],
        }),
    }),
    {
      name: "movie-recommender-store",
      storage,
      partialize: (state) => ({
        filters: state.filters,
        filteredTitles: state.filteredTitles,
        selectedSeedIds: state.selectedSeedIds,
        recommendations: state.recommendations,
      }),
    }
  )
);
