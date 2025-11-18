/**
 * ThemeGallery - Browse and select themes
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
  CircularProgress,
  Alert,
} from "@mui/material";
import { Search, Star, TrendingUp } from "@mui/icons-material";
import type { Theme, ThemeCategory } from "../../types";
import { themeService } from "@ai_workspace/services";
import { ThemeCard } from "./ThemeCard";
import { useAuth } from "@shared/context/AuthContext";

export interface ThemeGalleryProps {
  onSelectTheme?: (theme: Theme) => void;
  selectedThemeId?: string;
}

export function ThemeGallery({
  onSelectTheme,
  selectedThemeId,
}: ThemeGalleryProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<ThemeCategory | "all">(
    "all"
  );
  const [sortBy, setSortBy] = useState<"rating" | "popular">("rating");
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch themes from database on mount
  useEffect(() => {
    async function fetchThemes() {
      setLoading(true);
      setError(null);
      try {
        const fetchedThemes = await themeService.getAllThemes(user?.id);
        setThemes(fetchedThemes);
      } catch (err) {
        console.error("Failed to fetch themes:", err);
        setError("Failed to load themes. Using fallback themes.");
        // Fallback to static themes
        const fallbackThemes = themeService.getAllSystemThemes();
        setThemes(fallbackThemes);
      } finally {
        setLoading(false);
      }
    }

    fetchThemes();
  }, [user?.id]);

  // Apply filters to fetched themes
  let filteredThemes = themes;

  // Apply filters
  if (searchQuery) {
    filteredThemes = themeService.searchThemes(searchQuery, filteredThemes);
  }

  if (filterCategory !== "all") {
    filteredThemes = filteredThemes.filter(
      (t) => t.category === filterCategory
    );
  }

  // Apply sorting
  if (sortBy === "rating") {
    filteredThemes = themeService.sortByRating(filteredThemes);
  } else {
    filteredThemes = themeService.sortByPopularity(filteredThemes);
  }

  const categories: ThemeCategory[] = [
    "professional",
    "modern",
    "creative",
    "minimal",
    "bold",
  ];

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
            Visual Themes
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {filteredThemes.length} theme
            {filteredThemes.length !== 1 ? "s" : ""} available
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
            <TrendingUp sx={{ mr: 0.5, fontSize: 18 }} />
            Popular
          </ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      {/* Filters */}
      <Stack spacing={2} sx={{ mb: 3 }}>
        {/* Search */}
        <TextField
          placeholder="Search themes..."
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

        {/* Category filter */}
        <ToggleButtonGroup
          value={filterCategory}
          exclusive
          onChange={(_, value) => value && setFilterCategory(value)}
          size="small"
        >
          <ToggleButton value="all">All</ToggleButton>
          {categories.map((category) => (
            <ToggleButton key={category} value={category}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
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
          {/* Theme grid */}
          {filteredThemes.length > 0 ? (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 3,
              }}
            >
              {filteredThemes.map((theme) => (
                <ThemeCard
                  key={theme.id}
                  theme={theme}
                  onSelect={onSelectTheme}
                  isSelected={theme.id === selectedThemeId}
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
                No themes found
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
