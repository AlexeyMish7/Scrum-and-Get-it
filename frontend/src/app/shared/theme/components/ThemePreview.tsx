/**
 * Theme Preview Components
 *
 * Reusable components for previewing color and design presets
 * before applying them. Used in theme settings panels.
 */

import { Box, Typography, Stack, alpha } from "@mui/material";
import type { ColorPreset } from "../colorPresets/types";
import type { DesignPreset } from "../designPresets/types";

// ============================================================================
// COLOR SWATCH - Shows a single color with optional label
// ============================================================================

interface ColorSwatchProps {
  color: string;
  label?: string;
  size?: "small" | "medium" | "large";
}

export function ColorSwatch({
  color,
  label,
  size = "medium",
}: ColorSwatchProps) {
  const sizes = {
    small: 16,
    medium: 24,
    large: 32,
  };

  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
      <Box
        sx={{
          width: sizes[size],
          height: sizes[size],
          borderRadius: "4px",
          backgroundColor: color,
          border: "1px solid",
          borderColor: alpha("#000", 0.1),
          flexShrink: 0,
        }}
      />
      {label && (
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
      )}
    </Box>
  );
}

// ============================================================================
// COLOR PALETTE PREVIEW - Shows primary/secondary/tertiary colors
// ============================================================================

interface ColorPalettePreviewProps {
  colors: {
    primary: string;
    secondary: string;
    tertiary?: string;
  };
  compact?: boolean;
}

export function ColorPalettePreview({
  colors,
  compact = false,
}: ColorPalettePreviewProps) {
  const size = compact ? 12 : 20;
  const gap = compact ? 2 : 4;

  return (
    <Stack direction="row" spacing={`${gap}px`}>
      <Box
        sx={{
          width: size,
          height: size,
          borderRadius: "50%",
          backgroundColor: colors.primary,
          border: "1px solid",
          borderColor: alpha("#fff", 0.2),
        }}
      />
      <Box
        sx={{
          width: size,
          height: size,
          borderRadius: "50%",
          backgroundColor: colors.secondary,
          border: "1px solid",
          borderColor: alpha("#fff", 0.2),
        }}
      />
      {colors.tertiary && (
        <Box
          sx={{
            width: size,
            height: size,
            borderRadius: "50%",
            backgroundColor: colors.tertiary,
            border: "1px solid",
            borderColor: alpha("#fff", 0.2),
          }}
        />
      )}
    </Stack>
  );
}

// ============================================================================
// COLOR PRESET PREVIEW - Full preview of a color preset
// ============================================================================

interface ColorPresetPreviewProps {
  preset: ColorPreset;
  mode: "light" | "dark";
  showName?: boolean;
  showDescription?: boolean;
}

export function ColorPresetPreview({
  preset,
  mode,
  showName = true,
  showDescription = false,
}: ColorPresetPreviewProps) {
  const modeColors = mode === "light" ? preset.light : preset.dark;

  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 2,
        backgroundColor: modeColors.surface,
        border: "1px solid",
        borderColor: modeColors.border,
      }}
    >
      <Stack spacing={1}>
        {showName && (
          <Typography
            variant="subtitle2"
            sx={{ color: modeColors.textPrimary, fontWeight: 600 }}
          >
            {preset.name}
          </Typography>
        )}
        {showDescription && (
          <Typography
            variant="caption"
            sx={{ color: modeColors.textSecondary }}
          >
            {preset.description}
          </Typography>
        )}
        <ColorPalettePreview colors={preset.colors} />
      </Stack>
    </Box>
  );
}

// ============================================================================
// DESIGN PRESET PREVIEW - Shows border radius and shadow style
// ============================================================================

interface DesignPresetPreviewProps {
  preset: DesignPreset;
  primaryColor?: string;
  showName?: boolean;
}

export function DesignPresetPreview({
  preset,
  primaryColor = "#3b82f6",
  showName = true,
}: DesignPresetPreviewProps) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {showName && (
        <Typography variant="caption" color="text.secondary">
          {preset.name}
        </Typography>
      )}
      <Stack direction="row" spacing={1}>
        {/* Card preview */}
        <Box
          sx={{
            width: 40,
            height: 32,
            borderRadius: `${preset.borderRadius.lg}px`,
            backgroundColor: "background.paper",
            boxShadow: preset.elevation.level2,
            border: "1px solid",
            borderColor: "divider",
          }}
        />
        {/* Button preview */}
        <Box
          sx={{
            width: 32,
            height: 24,
            borderRadius: `${preset.borderRadius.md}px`,
            backgroundColor: primaryColor,
            boxShadow: preset.glow.enabled
              ? `${preset.glow.spread} ${alpha(primaryColor, 0.3)}`
              : preset.elevation.level1,
          }}
        />
        {/* Chip preview */}
        <Box
          sx={{
            width: 24,
            height: 16,
            borderRadius: `${preset.borderRadius.full}px`,
            backgroundColor: alpha(primaryColor, 0.1),
            border: "1px solid",
            borderColor: alpha(primaryColor, 0.3),
          }}
        />
      </Stack>
    </Box>
  );
}

// ============================================================================
// THEME COMBINATION PREVIEW - Shows mode + color + design together
// ============================================================================

interface ThemeCombinationPreviewProps {
  mode: "light" | "dark";
  colorPreset: ColorPreset;
  designPreset: DesignPreset;
}

export function ThemeCombinationPreview({
  mode,
  colorPreset,
  designPreset,
}: ThemeCombinationPreviewProps) {
  const modeColors = mode === "light" ? colorPreset.light : colorPreset.dark;
  const { borderRadius, elevation, glow } = designPreset;

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: `${borderRadius.lg}px`,
        backgroundColor: modeColors.background,
        boxShadow: elevation.level2,
        minWidth: 200,
      }}
    >
      {/* Header bar */}
      <Box
        sx={{
          height: 24,
          mb: 1.5,
          borderRadius: `${borderRadius.md}px`,
          backgroundColor: modeColors.surface,
          display: "flex",
          alignItems: "center",
          px: 1,
          gap: 0.5,
        }}
      >
        <Box
          sx={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            backgroundColor: colorPreset.palette.error,
          }}
        />
        <Box
          sx={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            backgroundColor: colorPreset.palette.warning,
          }}
        />
        <Box
          sx={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            backgroundColor: colorPreset.palette.success,
          }}
        />
      </Box>

      {/* Content */}
      <Stack spacing={1}>
        {/* Title bar */}
        <Box
          sx={{
            height: 8,
            width: "70%",
            borderRadius: `${borderRadius.sm}px`,
            backgroundColor: modeColors.textPrimary,
            opacity: 0.8,
          }}
        />
        <Box
          sx={{
            height: 6,
            width: "90%",
            borderRadius: `${borderRadius.sm}px`,
            backgroundColor: modeColors.textSecondary,
            opacity: 0.5,
          }}
        />

        {/* Card */}
        <Box
          sx={{
            p: 1,
            mt: 0.5,
            borderRadius: `${borderRadius.md}px`,
            backgroundColor: modeColors.surface,
            boxShadow: elevation.level1,
            display: "flex",
            gap: 1,
          }}
        >
          <Box
            sx={{
              width: 24,
              height: 24,
              borderRadius: `${borderRadius.sm}px`,
              backgroundColor: colorPreset.palette.primary,
            }}
          />
          <Stack spacing={0.5} flex={1}>
            <Box
              sx={{
                height: 5,
                width: "60%",
                borderRadius: 1,
                backgroundColor: modeColors.textPrimary,
                opacity: 0.6,
              }}
            />
            <Box
              sx={{
                height: 4,
                width: "80%",
                borderRadius: 1,
                backgroundColor: modeColors.textSecondary,
                opacity: 0.4,
              }}
            />
          </Stack>
        </Box>

        {/* Button */}
        <Box
          sx={{
            height: 20,
            borderRadius: `${borderRadius.md}px`,
            backgroundColor: colorPreset.palette.primary,
            boxShadow: glow.enabled
              ? `${glow.spread} ${alpha(colorPreset.palette.primary, 0.3)}`
              : elevation.level1,
          }}
        />
      </Stack>
    </Box>
  );
}
