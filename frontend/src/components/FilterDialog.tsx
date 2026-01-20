import {
  Button,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Dropdown,
  Option,
  Input,
  Spinner,
  MessageBar,
  Tag,
  TagGroup,
  Field,
  tokens,
} from "@fluentui/react-components";

import { Dismiss16Regular } from "@fluentui/react-icons";
import { useEffect, useMemo, useState } from "react";
import type { FilterState } from "../types";
import { defaultFilters } from "../store/AppStore";

const platformOptions = ["Netflix", "Disney+"];
const typeOptions = ["Movie", "TV Show"];

type FilterDialogProps = {
  open: boolean;
  initialFilters: FilterState;
  onDismiss: () => void;
  onApply: (filters: FilterState) => Promise<void>;
};

export const FilterDialog = ({ open, initialFilters, onDismiss, onApply }: FilterDialogProps) => {
  const [filters, setFilters] = useState<FilterState>(initialFilters);

  const [countryInput, setCountryInput] = useState("");

  // ✅ Text state riêng cho year để không bị giật/nhảy số khi user đang gõ
  const [minYearText, setMinYearText] = useState("");
  const [maxYearText, setMaxYearText] = useState("");

  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const yearError =
    filters.minYear !== null &&
    filters.maxYear !== null &&
    filters.minYear > filters.maxYear;

  useEffect(() => {
    if (open) {
      setFilters(initialFilters);
      setCountryInput("");
      setError(null);

      setMinYearText(initialFilters.minYear?.toString() ?? "");
      setMaxYearText(initialFilters.maxYear?.toString() ?? "");
    }
  }, [initialFilters, open]);

  const disableApply = useMemo(() => isSubmitting || yearError, [isSubmitting, yearError]);

  const updatePlatforms = (_: unknown, data: { selectedOptions: string[] }) => {
    setFilters((prev) => ({ ...prev, platforms: data.selectedOptions }));
  };

  const updateTypes = (_: unknown, data: { selectedOptions: string[] }) => {
    setFilters((prev) => ({ ...prev, types: data.selectedOptions }));
  };

  const updateYear = (key: "minYear" | "maxYear", value: number | null) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const removeCountry = (country: string) => {
    setFilters((prev) => ({
      ...prev,
      countries: prev.countries.filter((c) => c !== country),
    }));
  };

  const handleAddCountry = (value: string) => {
    const clean = value.trim();
    if (!clean.length) return;

    setFilters((prev) => ({
      ...prev,
      countries: prev.countries.includes(clean) ? prev.countries : [...prev.countries, clean],
    }));
    setCountryInput("");
  };

  const handleCountryKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      handleAddCountry(countryInput);
    }
  };

  const handleReset = () => {
    setFilters({ ...defaultFilters });
    setCountryInput("");
    setError(null);

    // reset year text
    setMinYearText("");
    setMaxYearText("");
  };

  const withPendingCountry = (): FilterState => {
    const pending = countryInput.trim();
    if (!pending) {
      return filters;
    }
    if (filters.countries.includes(pending)) {
      return filters;
    }
    return {
      ...filters,
      countries: [...filters.countries, pending],
    };
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    const nextFilters = withPendingCountry();
    try {
      await onApply(nextFilters);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to apply filters";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(_, data) => !data.open && onDismiss()}>
      <DialogSurface aria-describedby={undefined}>
        <DialogBody>
          <DialogTitle>Filter catalog</DialogTitle>

          <DialogContent>
            {error ? (
              <MessageBar intent="error" style={{ marginBottom: tokens.spacingVerticalL }}>
                {error}
              </MessageBar>
            ) : null}

            <Field label="Platforms">
              <Dropdown
                aria-label="Platform filters"
                multiselect
                selectedOptions={filters.platforms}
                onOptionSelect={updatePlatforms}
              >
                {platformOptions.map((platform) => (
                  <Option key={platform}>{platform}</Option>
                ))}
              </Dropdown>
            </Field>

            <Field label="Type" style={{ marginTop: tokens.spacingVerticalL }}>
              <Dropdown
                aria-label="Type filters"
                multiselect
                selectedOptions={filters.types}
                onOptionSelect={updateTypes}
              >
                {typeOptions.map((item) => (
                  <Option key={item}>{item}</Option>
                ))}
              </Dropdown>
            </Field>

            <Field label="Countries" style={{ marginTop: tokens.spacingVerticalL }}>
              <Input
                placeholder="Add countries (press Enter)"
                value={countryInput}
                onChange={(_, data) => setCountryInput(data.value)}
                onKeyDown={handleCountryKeyDown}
              />

              {filters.countries.length > 0 ? (
                <div style={{ marginTop: tokens.spacingVerticalS }}>
                  <TagGroup aria-label="Selected countries">
                    {filters.countries.map((country) => (
                      <Tag key={country} shape="rounded" size="small">
                        <span style={{ marginRight: 8 }}>{country}</span>
                        <Button
                          appearance="transparent"
                          size="small"
                          icon={<Dismiss16Regular />}
                          aria-label={`Remove ${country}`}
                          onClick={() => removeCountry(country)}
                        />
                      </Tag>
                    ))}
                  </TagGroup>
                </div>
              ) : null}
            </Field>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: tokens.spacingHorizontalXL,
                marginTop: tokens.spacingVerticalL,
              }}
            >
              <Field label="Minimum year">
                <Input
                  type="number"
                  placeholder="e.g. 2005"
                  value={minYearText}
                  onChange={(_, data) => {
                    const v = data.value;
                    setMinYearText(v);

                    if (v.trim() === "") {
                      updateYear("minYear", null);
                      return;
                    }

                    const n = Number(v);
                    if (!Number.isNaN(n)) updateYear("minYear", n);
                  }}
                />
              </Field>

              <Field label="Maximum year">
                <Input
                  type="number"
                  placeholder="e.g. 2024"
                  value={maxYearText}
                  onChange={(_, data) => {
                    const v = data.value;
                    setMaxYearText(v);

                    if (v.trim() === "") {
                      updateYear("maxYear", null);
                      return;
                    }

                    const n = Number(v);
                    if (!Number.isNaN(n)) updateYear("maxYear", n);
                  }}
                />
              </Field>
            </div>

            {yearError ? (
              <MessageBar intent="warning" style={{ marginTop: tokens.spacingVerticalS }}>
                Minimum year must be less than or equal to maximum year.
              </MessageBar>
            ) : null}
          </DialogContent>

          <DialogActions>
            <div style={{ display: "flex", alignItems: "center", gap: tokens.spacingHorizontalM }}>
              {isSubmitting ? <Spinner size="tiny" label="Loading" /> : null}
            </div>

            <Button appearance="secondary" onClick={handleReset} disabled={isSubmitting}>
              Reset
            </Button>
            <Button appearance="secondary" onClick={onDismiss} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button appearance="primary" onClick={handleSubmit} disabled={disableApply}>
              Apply Filters
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};
