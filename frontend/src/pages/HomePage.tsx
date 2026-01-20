import { Button, Body1 } from "@fluentui/react-components";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import heroBg from "../assets/background.png";
import { FilterDialog } from "../components/FilterDialog";
import { fetchTitles } from "../api/client";
import { useAppStore } from "../store/AppStore";
import type { FilterState } from "../types";

export const HomePage = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { filters, setFilteredTitles, setFilters: updateFilters, resetAll } = useAppStore((state) => ({
    filters: state.filters,
    setFilteredTitles: state.setFilteredTitles,
    setFilters: state.setFilters,
    resetAll: state.resetAll,
  }));

  useEffect(() => {
    resetAll();
  }, [resetAll]);

  const handleApplyFilters = async (newFilters: FilterState) => {
    const titles = await fetchTitles(newFilters);
    updateFilters(newFilters);
    setFilteredTitles(titles);
    setDialogOpen(false);
    navigate("/results");
  };

  return (
    <div>
      <section
        className="hero-bg"
        style={{
          backgroundImage: `url(${heroBg})`,
        }}
      >
        <div className="hero-overlay" />

        <div className="hero-content">
          <p className="hero-subtitle">
            Explore movies, choose your favorites, and get AI-powered recommendations.
          </p>

          <div className="hero-actions">
            <Button appearance="primary" size="large" onClick={() => setDialogOpen(true)}>
              Filter Movies
            </Button>
          </div>
        </div>
      </section>

      <FilterDialog
        open={dialogOpen}
        initialFilters={filters}
        onDismiss={() => setDialogOpen(false)}
        onApply={handleApplyFilters}
      />
    </div>
  );
};
