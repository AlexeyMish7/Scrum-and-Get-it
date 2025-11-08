import { useState } from "react";
import { Box, Stack, TextField, MenuItem, Button, InputAdornment } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

/**
 * JobSearchFilters
 * Reusable search & filter UI for jobs. Designed to be framework-agnostic
 * and emit a plain filter object to callers.
 *
 * Props:
 * - onApply(filters): called when user clicks Apply or presses Enter in the query field
 * - onChange(filters): optional, called when any field changes (useful for live filtering)
 * - initial?: partial initial filters
 */
export type JobFilters = {
  query?: string;
  industry?: string;
  location?: string;
  salaryMin?: number | "";
  salaryMax?: number | "";
  deadlineFrom?: string; // yyyy-mm-dd
  deadlineTo?: string; // yyyy-mm-dd
  sortBy?: "date_added" | "deadline" | "salary" | "company";
  sortDir?: "asc" | "desc";
};

type Props = {
  onApply: (f: JobFilters) => void;
  onChange?: (f: JobFilters) => void;
  initial?: JobFilters;
};

const SORT_OPTIONS = [
  { value: "date_added", label: "Date added" },
  { value: "deadline", label: "Deadline" },
  { value: "salary", label: "Salary (start)" },
  { value: "company", label: "Company name" },
];

export default function JobSearchFilters({ onApply, onChange, initial }: Props) {
  const [filters, setFilters] = useState<JobFilters>({
    query: "",
    industry: "",
    location: "",
    salaryMin: "",
    salaryMax: "",
    deadlineFrom: "",
    deadlineTo: "",
    sortBy: "date_added",
    sortDir: "desc",
    ...initial,
  });

  function update(partial: Partial<JobFilters>, apply = false) {
    const next = { ...filters, ...partial };
    setFilters(next);
    if (onChange) onChange(next);
    if (apply) onApply(next);
  }

  function clear() {
    const next: JobFilters = {
      query: "",
      industry: "",
      location: "",
      salaryMin: "",
      salaryMax: "",
      deadlineFrom: "",
      deadlineTo: "",
      sortBy: "date_added",
      sortDir: "desc",
    };
    setFilters(next);
    if (onChange) onChange(next);
    onApply(next);
  }

  return (
    <Box sx={{ mb: 2 }}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
        <TextField
          placeholder="Search title, company, keywords..."
          size="small"
          sx={{ minWidth: 260, flex: 1 }}
          value={filters.query}
          onChange={(e) => update({ query: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === "Enter") onApply(filters);
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />

        <TextField
          size="small"
          select
          label="Industry"
          value={filters.industry}
          onChange={(e) => update({ industry: e.target.value })}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="technology">Technology</MenuItem>
          <MenuItem value="finance">Finance</MenuItem>
          <MenuItem value="healthcare">Healthcare</MenuItem>
          <MenuItem value="education">Education</MenuItem>
          <MenuItem value="manufacturing">Manufacturing</MenuItem>
          <MenuItem value="other">Other</MenuItem>
        </TextField>

        <TextField
          size="small"
          label="Location"
          placeholder="city, state or zip"
          value={filters.location}
          onChange={(e) => update({ location: e.target.value })}
          sx={{ minWidth: 160 }}
        />

        <TextField
          size="small"
          label="Salary Min"
          type="number"
          value={filters.salaryMin as any}
          onChange={(e) => update({ salaryMin: e.target.value === "" ? "" : Number(e.target.value) })}
          sx={{ width: 120 }}
        />

        <TextField
          size="small"
          label="Salary Max"
          type="number"
          value={filters.salaryMax as any}
          onChange={(e) => update({ salaryMax: e.target.value === "" ? "" : Number(e.target.value) })}
          sx={{ width: 120 }}
        />
      </Stack>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center" sx={{ mt: 2 }}>
        <TextField
          size="small"
          label="Deadline from"
          type="date"
          InputLabelProps={{ shrink: true }}
          value={filters.deadlineFrom ?? ""}
          onChange={(e) => update({ deadlineFrom: e.target.value })}
          sx={{ width: 180 }}
        />

        <TextField
          size="small"
          label="Deadline to"
          type="date"
          InputLabelProps={{ shrink: true }}
          value={filters.deadlineTo ?? ""}
          onChange={(e) => update({ deadlineTo: e.target.value })}
          sx={{ width: 180 }}
        />

        <TextField
          size="small"
          select
          label="Sort by"
          value={filters.sortBy}
          onChange={(e) => update({ sortBy: e.target.value as any })}
          sx={{ minWidth: 160 }}
        >
          {SORT_OPTIONS.map((o) => (
            <MenuItem key={o.value} value={o.value}>
              {o.label}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          size="small"
          select
          label="Dir"
          value={filters.sortDir}
          onChange={(e) => update({ sortDir: e.target.value as any })}
          sx={{ width: 110 }}
        >
          <MenuItem value="desc">Desc</MenuItem>
          <MenuItem value="asc">Asc</MenuItem>
        </TextField>

        <Box sx={{ ml: "auto", display: "flex", gap: 1 }}>
          <Button onClick={clear} size="small">
            Clear
          </Button>
          <Button variant="contained" onClick={() => onApply(filters)} size="small">
            Apply
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}
