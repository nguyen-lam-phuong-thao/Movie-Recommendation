import { Button, MessageBar, Title2, Subtitle2, tokens } from "@fluentui/react-components";
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MovieCard } from "../components/MovieCard";
import { useAppStore } from "../store/AppStore";
import resultsBg from "../assets/background2.png";

export const RecommendationsPage = () => {
  const navigate = useNavigate();
  const { recommendations, resetAll } = useAppStore((state) => ({
    recommendations: state.recommendations,
    resetAll: state.resetAll,
  }));
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!recommendations.length) {
      resetAll();
      navigate("/");
    }
  }, [recommendations.length, navigate, resetAll]);

  const handleStartOver = () => {
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
          <div
            style={{
              display: "flex",
              gap: tokens.spacingHorizontalS,
              marginBottom: tokens.spacingVerticalM,
            }}
          >
            <Button appearance="secondary" onClick={() => navigate("/results")}>
              Back to Filters
            </Button>
            <Button appearance="transparent" onClick={handleStartOver}>
              Back to Home
            </Button>
          </div>

          <div className="results-header">
            <Title2
              style={{
                color: tokens.colorBrandForegroundLink,
                marginBottom: tokens.spacingVerticalXS,
                fontWeight: 800,
              }}
            >
              Recommended titles
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
              Based on your selected seeds and active filters.
            </Subtitle2>
          </div>

          {!recommendations.length ? (
            <MessageBar intent="info">No recommendations yet. Please start from the home page.</MessageBar>
          ) : (
            <div className="card-grid">
              {recommendations.map((movie) => (
                <MovieCard key={movie.vector_id} title={movie} />
              ))}
            </div>
          )}

          <Button
            appearance="primary"
            style={{ marginTop: tokens.spacingVerticalXXL }}
            onClick={handleStartOver}
          >
            Start Over
          </Button>
        </div>
      </div>
    </div>
  );
};
