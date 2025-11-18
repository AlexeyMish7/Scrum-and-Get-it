/**
 * ThemeCard - Display theme with color preview and metadata
 */

import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  Button,
  Stack,
} from "@mui/material";
import { CheckCircle, Star, Palette } from "@mui/icons-material";
import type { Theme } from "../../types";
import { themeService } from "@ai_workspace/services";

export interface ThemeCardProps {
  theme: Theme;
  onSelect?: (theme: Theme) => void;
  onPreview?: (theme: Theme) => void;
  isSelected?: boolean;
}

export function ThemeCard({
  theme,
  onSelect,
  onPreview,
  isSelected = false,
}: ThemeCardProps) {
  const colors = themeService.getThemeColorPreview(theme);

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        border: isSelected ? 2 : 1,
        borderColor: isSelected ? "primary.main" : "divider",
        transition: "all 0.2s",
        "&:hover": {
          boxShadow: 4,
          transform: "translateY(-4px)",
        },
      }}
    >
      {/* Selected indicator */}
      {isSelected && (
        <Box
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            zIndex: 1,
          }}
        >
          <CheckCircle color="primary" />
        </Box>
      )}

      {/* Color preview */}
      <Box
        sx={{
          height: 120,
          display: "flex",
          cursor: onPreview ? "pointer" : "default",
        }}
        onClick={() => onPreview?.(theme)}
      >
        {/* Color swatches */}
        <Box sx={{ flex: 1, bgcolor: colors.primary }} />
        <Box sx={{ flex: 1, bgcolor: colors.secondary }} />
        <Box sx={{ flex: 1, bgcolor: colors.accent }} />
      </Box>

      {/* Font preview */}
      <Box
        sx={{
          height: 80,
          p: 2,
          bgcolor: colors.background,
          borderBottom: 1,
          borderColor: "divider",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 0.5,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontFamily: theme.typography.headingFont.family,
            fontWeight: theme.typography.headingFont.weights[0],
            color: theme.colors.text.primary,
            fontSize: "14px",
          }}
        >
          {theme.typography.headingFont.family}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            fontFamily: theme.typography.bodyFont.family,
            color: theme.colors.text.secondary,
            fontSize: "11px",
          }}
        >
          {theme.typography.bodyFont.family}
        </Typography>
      </Box>

      <CardContent sx={{ flexGrow: 1, pt: 2 }}>
        {/* Theme name */}
        <Typography variant="h6" gutterBottom>
          {theme.name}
        </Typography>

        {/* Description */}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {theme.metadata.description}
        </Typography>

        {/* Features */}
        <Stack
          direction="row"
          spacing={1}
          flexWrap="wrap"
          gap={1}
          sx={{ mb: 2 }}
        >
          {theme.isDefault && (
            <Chip label="Default" size="small" color="primary" />
          )}
          <Chip label={theme.category} size="small" variant="outlined" />
          {theme.typography.headingFont.googleFontsUrl && (
            <Chip
              icon={<Palette sx={{ fontSize: 14 }} />}
              label="Web Fonts"
              size="small"
              variant="outlined"
            />
          )}
        </Stack>

        {/* Rating */}
        {theme.metadata.rating && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Star sx={{ fontSize: 16, color: "warning.main" }} />
            <Typography variant="body2" color="text.secondary">
              {theme.metadata.rating.toFixed(1)}
            </Typography>
          </Box>
        )}

        {/* Tags */}
        <Box sx={{ mt: 1 }}>
          {theme.metadata.tags.slice(0, 3).map((tag: string) => (
            <Chip
              key={tag}
              label={tag}
              size="small"
              variant="outlined"
              sx={{ mr: 0.5, mb: 0.5 }}
            />
          ))}
        </Box>
      </CardContent>

      <CardActions sx={{ p: 2, pt: 0 }}>
        <Button
          variant={isSelected ? "outlined" : "contained"}
          fullWidth
          onClick={() => onSelect?.(theme)}
          disabled={isSelected}
        >
          {isSelected ? "Selected" : "Use Theme"}
        </Button>
      </CardActions>
    </Card>
  );
}
