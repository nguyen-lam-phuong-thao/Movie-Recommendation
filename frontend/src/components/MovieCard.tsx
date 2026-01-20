import {
  Badge,
  Body1,
  Caption1,
  Card,
  CardHeader,
  Text,
  ToggleButton,
  tokens,
} from "@fluentui/react-components";
import { Checkmark24Regular } from "@fluentui/react-icons";
import type { TitleResponse } from "../types";
import { memo } from "react";

type MovieCardProps = {
  title: TitleResponse;
  selected?: boolean;
  onToggleSelect?: (id: number) => void;
  showSelection?: boolean;
};

const formatGenres = (genres: string[]): { visible: string[]; remaining: number } => {
  const clean = genres.filter(Boolean);
  const visible = clean.slice(0, 4);
  const remaining = clean.length - visible.length;
  return { visible, remaining };
};

const MovieCardComponent = ({ title, selected = false, onToggleSelect, showSelection = false }: MovieCardProps) => {
  const { visible, remaining } = formatGenres(title.genre_list || []);
  return (
    <Card
      style={{
        borderRadius: "18px",
        borderColor: selected ? tokens.colorPaletteRoyalBlueBorderActive : tokens.colorNeutralStroke3,
        boxShadow: selected
          ? "0 18px 40px rgba(59, 130, 246, 0.18)"
          : "0 12px 30px rgba(15, 23, 42, 0.08)",
      }}
    >
      <CardHeader
        header={
          <Text weight="semibold" size={500}>
            {title.title}
          </Text>
        }
        description={<Caption1>{`${title.type} • ${title.release_year}`}</Caption1>}
        action={
          showSelection ? (
            <ToggleButton
              size="small"
              appearance={selected ? "primary" : "secondary"}
              checked={selected}
              icon={selected ? <Checkmark24Regular /> : undefined}
              onClick={(event) => {
                event.stopPropagation();
                onToggleSelect?.(title.vector_id);
              }}
            >
              {selected ? "Selected" : "Select"}
            </ToggleButton>
          ) : undefined
        }
      />
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          flexWrap: "wrap",
          marginBottom: "0.5rem",
        }}
      >
        <Badge appearance="tint" color="brand">
          {title.platform}
        </Badge>
        {title.country ? (
          <span className="country-pill" title={title.country}>
            {title.country}
          </span>
        ) : null}
      </div>
      <Body1 className="movie-description">{title.description || "No description available."}</Body1>
      <div className="genre-chips">
        {visible.map((genre) => (
          <span key={genre} className="genre-chip">
            {genre}
          </span>
        ))}
        {remaining > 0 ? (
          <span className="genre-chip">+{remaining}</span>
        ) : null}
      </div>
    </Card>
  );
};

export const MovieCard = memo(MovieCardComponent);
