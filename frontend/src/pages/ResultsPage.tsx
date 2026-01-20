import {
  Badge,
  Body1,
  Button,
  Input,
  MessageBar,
  Spinner,
  Subtitle2,
  Title2,
  tokens,
} from "@fluentui/react-components";
import {
  ArrowLeft24Regular,
  ChevronLeft24Regular,
  ChevronRight24Regular,
} from "@fluentui/react-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MovieCard } from "../components/MovieCard";
import { useAppStore } from "../store/AppStore";
import { fetchRecommendations } from "../api/client";
import resultsBg from "../assets/background2.png";

const ITEMS_PER_PAGE = 6;

export const ResultsPage = () => {
  const navigate = useNavigate();

  const {
    filteredTitles,
    selectedSeedIds,
    toggleSeed,
    clearSeeds,
    filters,
    setRecommendations,
    resetAll,
  } = useAppStore((state) => ({
    filteredTitles: state.filteredTitles,
    selectedSeedIds: state.selectedSeedIds,
    toggleSeed: state.toggleSeed,
    clearSeeds: state.clearSeeds,
    filters: state.filters,
    setRecommendations: state.setRecommendations,
    resetAll: state.resetAll,
  }));

  const [topK, setTopK] = useState<string>("5");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!filteredTitles.length) {
      resetAll();
      navigate("/");
    }
  }, [filteredTitles.length, navigate, resetAll]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filteredTitles.length]);

  useEffect(() => {
    contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredTitles.length / ITEMS_PER_PAGE));

  const pagedTitles = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTitles.slice(start, start + ITEMS_PER_PAGE);
  }, [currentPage, filteredTitles]);

  const showingStart = filteredTitles.length ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0;
  const showingEnd = Math.min(currentPage * ITEMS_PER_PAGE, filteredTitles.length);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const handleRecommend = async () => {
    setLoading(true);
    setError(null);

    try {
      const parsed = Number.parseInt(topK, 10);
      const safeTopK = Number.isNaN(parsed) ? 12 : Math.min(50, Math.max(1, parsed));

      const recs = await fetchRecommendations(selectedSeedIds, filters, safeTopK);
      setRecommendations(recs);
      navigate("/recommendations");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to fetch recommendations";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const pageItems = createPageSequence(currentPage, totalPages);
  const handleBackHome = () => {
    resetAll();
    navigate("/");
  };

  return (
    <div
      className="results-background"
      style={{
        backgroundImage: `url(${resultsBg})`,
      }}
    >
      <div className="results-overlay" />

      <div className="results-shell">
        <div className="results-card" ref={contentRef}>
          <Button
            appearance="subtle"
            icon={<ArrowLeft24Regular />}
            onClick={handleBackHome}
            style={{
              marginBottom: tokens.spacingVerticalM,
              color: tokens.colorBrandForegroundLink,
            }}
          >
            Back to Home
          </Button>

          <div className="results-header">
            <Title2
              style={{
                color: tokens.colorBrandForegroundLink,
                marginBottom: tokens.spacingVerticalXS,
                fontWeight: 800,
                fontSize: "32px",
              }}
            >
              Filtered Titles
            </Title2>

            <Subtitle2
              style={{
                color: tokens.colorNeutralForeground3,
                display: "block",
                marginTop: 6,
                fontSize: "16px",
                lineHeight: 1.5,
              }}
            >
              Select movies you enjoy to discover more like them.
            </Subtitle2>
          </div>

          <div className="action-bar">
            <div className="selected-count">
              <Badge appearance="filled" color="brand">
                {selectedSeedIds.length}
              </Badge>
              <span>Selected</span>
            </div>

            <div
              style={{
                flex: 1,
                minWidth: 260,
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
              }}
            >
              <Body1 style={{ fontWeight: 600, margin: 0 }}>Number of recommendations</Body1>
              <Input
                type="number"
                value={topK}
                min={1}
                max={50}
                inputMode="numeric"
                onChange={(_, data) => setTopK(data.value)}
                style={{ width: 96, marginLeft: "0.5rem" }}
              />
            </div>

            <div style={{ display: "flex", gap: tokens.spacingHorizontalS }}>
              <Button
                appearance="secondary"
                onClick={clearSeeds}
                disabled={!selectedSeedIds.length || loading}
              >
                Clear
              </Button>

              <Button
                appearance="primary"
                onClick={handleRecommend}
                disabled={!selectedSeedIds.length || loading}
              >
                {loading ? <Spinner size="extra-tiny" /> : "Recommend"}
              </Button>
            </div>
          </div>

          {error ? (
            <MessageBar intent="error" style={{ marginBottom: tokens.spacingVerticalM }}>
              {error}
            </MessageBar>
          ) : null}

          <div className="card-grid">
            {pagedTitles.map((movie) => (
              <MovieCard
                key={movie.vector_id}
                title={movie}
                selected={selectedSeedIds.includes(movie.vector_id)}
                showSelection
                onToggleSelect={toggleSeed}
              />
            ))}
          </div>

          {filteredTitles.length ? (
            <div className="pagination">
              <Body1>
                Showing {showingStart}-{showingEnd} of {filteredTitles.length}
              </Body1>

              <div className="pagination-controls">
                <Button
                  appearance="transparent"
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                >
                  <ChevronLeft24Regular style={{ marginRight: 4 }} />
                  Previous
                </Button>

                {pageItems.map((item, index) =>
                  item === "ellipsis" ? (
                    <span key={`ellipsis-${index}`} className="pagination-ellipsis">
                      …
                    </span>
                  ) : (
                    <Button
                      key={item}
                      appearance={item === currentPage ? "primary" : "secondary"}
                      onClick={() => handlePageChange(item)}
                    >
                      {item}
                    </Button>
                  )
                )}

                <Button
                  appearance="transparent"
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                >
                  Next
                  <ChevronRight24Regular style={{ marginLeft: 4 }} />
                </Button>
              </div>
            </div>
          ) : (
            <MessageBar intent="warning" style={{ marginTop: tokens.spacingVerticalL }}>
              No titles match the selected filters. Please adjust filters from the home page.
            </MessageBar>
          )}
        </div>
      </div>
    </div>
  );
};

const createPageSequence = (current: number, total: number): Array<number | "ellipsis"> => {
  if (total <= 5) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const pages: Array<number | "ellipsis"> = [];
  const push = (value: number | "ellipsis") => {
    if (pages[pages.length - 1] !== value) pages.push(value);
  };

  push(1);
  if (current > 3) push("ellipsis");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let page = start; page <= end; page += 1) {
    push(page);
  }

  if (current < total - 2) push("ellipsis");
  push(total);

  return pages;
};
