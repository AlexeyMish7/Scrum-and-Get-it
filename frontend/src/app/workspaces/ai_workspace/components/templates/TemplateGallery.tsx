/**
 * TemplateGallery - Browse and select templates
 */

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Stack,
  TextField,
  InputAdornment,
  ToggleButtonGroup,
  ToggleButton,
  FormControlLabel,
  Switch,
  CircularProgress,
  Alert,
} from "@mui/material";
import { Search, ViewModule, Star } from "@mui/icons-material";
import type { Template, TemplateCategory, TemplateSubtype } from "../../types";
import { templateService } from "@ai_workspace/services";
import { TemplateCard } from "./TemplateCard";
import { useAuth } from "@shared/context/AuthContext";

export interface TemplateGalleryProps {
  category: TemplateCategory;
  onSelectTemplate?: (template: Template) => void;
  selectedTemplateId?: string;
}

export function TemplateGallery({
  category,
  onSelectTemplate,
  selectedTemplateId,
}: TemplateGalleryProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSubtype, setFilterSubtype] = useState<TemplateSubtype | "all">(
    "all"
  );
  const [atsOnly, setAtsOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"rating" | "popular">("rating");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch templates from database on mount or category change
  useEffect(() => {
    async function fetchTemplates() {
      setLoading(true);
      setError(null);
      try {
        const fetchedTemplates = await templateService.getAllTemplates(
          user?.id,
          category
        );
        setTemplates(fetchedTemplates);
      } catch (err) {
        console.error("Failed to fetch templates:", err);
        setError("Failed to load templates. Using fallback templates.");
        // Fallback to static templates
        const fallbackTemplates =
          templateService.getTemplatesByCategory(category);
        setTemplates(fallbackTemplates);
      } finally {
        setLoading(false);
      }
    }

    fetchTemplates();
  }, [user?.id, category]);

  // Apply filters to fetched templates
  let filteredTemplates = templates;

  // Apply filters
  if (searchQuery) {
    filteredTemplates = templateService.searchTemplates(
      searchQuery,
      filteredTemplates
    );
  }

  if (filterSubtype !== "all") {
    filteredTemplates = filteredTemplates.filter(
      (t) => t.subtype === filterSubtype
    );
  }

  if (atsOnly) {
    filteredTemplates = filteredTemplates.filter(
      (t) => t.features.atsOptimized
    );
  }

  // Apply sorting
  if (sortBy === "rating") {
    filteredTemplates = templateService.sortByRating(filteredTemplates);
  } else {
    filteredTemplates = templateService.sortByPopularity(filteredTemplates);
  }

  // Available subtypes for this category - different for resume vs cover letter
  const subtypes: TemplateSubtype[] =
    category === "resume"
      ? [
          "chronological",
          "functional",
          "hybrid",
          "creative",
          "academic",
          "executive",
          "simple",
        ]
      : ["professional", "modern", "simple"];

  return (
    <Box>
      {/* Header */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h5" gutterBottom>
            {category === "resume" ? "Resume" : "Cover Letter"} Templates
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {filteredTemplates.length} template
            {filteredTemplates.length !== 1 ? "s" : ""} available
          </Typography>
        </Box>

        {/* Sort toggle */}
        <ToggleButtonGroup
          value={sortBy}
          exclusive
          onChange={(_, value) => value && setSortBy(value)}
          size="small"
        >
          <ToggleButton value="rating">
            <Star sx={{ mr: 0.5, fontSize: 18 }} />
            Top Rated
          </ToggleButton>
          <ToggleButton value="popular">
            <ViewModule sx={{ mr: 0.5, fontSize: 18 }} />
            Popular
          </ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      {/* Filters */}
      <Stack spacing={2} sx={{ mb: 3 }}>
        {/* Search */}
        <TextField
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          fullWidth
        />

        {/* Subtype filter and ATS toggle */}
        <Stack direction="row" spacing={2} alignItems="center">
          <ToggleButtonGroup
            value={filterSubtype}
            exclusive
            onChange={(_, value) => value && setFilterSubtype(value)}
            size="small"
          >
            <ToggleButton value="all">All</ToggleButton>
            {subtypes.map((subtype) => (
              <ToggleButton key={subtype} value={subtype}>
                {subtype.charAt(0).toUpperCase() + subtype.slice(1)}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>

          <FormControlLabel
            control={
              <Switch
                checked={atsOnly}
                onChange={(e) => setAtsOnly(e.target.checked)}
                size="small"
              />
            }
            label="ATS Optimized Only"
          />
        </Stack>
      </Stack>

      {/* Error message */}
      {error && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Loading state */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Template grid */}
          {filteredTemplates.length > 0 ? (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: 3,
              }}
            >
              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onSelect={onSelectTemplate}
                  isSelected={template.id === selectedTemplateId}
                />
              ))}
            </Box>
          ) : (
            <Box
              sx={{
                textAlign: "center",
                py: 8,
                color: "text.secondary",
              }}
            >
              <Typography variant="h6" gutterBottom>
                No templates found
              </Typography>
              <Typography variant="body2">
                Try adjusting your filters or search query
              </Typography>
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
