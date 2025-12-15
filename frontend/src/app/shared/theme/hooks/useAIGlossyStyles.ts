/**
 * useAIGlossyStyles Hook
 *
 * Provides AI-specific glossy gradient styles based on current theme.
 * Returns SX props ready to use with MUI components.
 *
 * Usage:
 *   const aiStyles = useAIGlossyStyles();
 *   <Typography sx={aiStyles.text}>AI Generated</Typography>
 *   <Box sx={aiStyles.background}>...</Box>
 */

import { useTheme } from "@mui/material/styles";
import { useThemeContext } from "@shared/context/ThemeContext";
import { getAIGlossyConfig } from "../aiGlossy";
import type { ColorPresetId } from "../colorPresets/types";

/**
 * Returns AI glossy styles for the current theme configuration
 */
export function useAIGlossyStyles() {
  const theme = useTheme();
  const themeContext = useThemeContext();

  // Get current color preset from theme context
  const colorPreset = (themeContext.colorPreset ?? "default") as ColorPresetId;
  const mode = theme.palette.mode;

  // Get AI glossy config for this preset
  const config = getAIGlossyConfig(colorPreset);

  return {
    // Sharp, crisp text rendering for AI content
    text: {
      fontWeight: 600,
      textRendering: "optimizeLegibility",
      WebkitFontSmoothing: "antialiased",
      MozOsxFontSmoothing: "grayscale",
    },

    // Sharp, rigid container styling - minimal rounding, crisp edges
    background: {
      borderRadius: 1, // Sharp corners instead of rounded
      border: 0,
      boxShadow: theme.shadows[1],
    },

    // Sharp accent border
    accent: {
      boxShadow: `0 0 0 2px rgba(var(--mui-palette-primary-main-rgb), 0.16)`,
    },

    shimmer: {},

    // Sharp badge with minimal rounding
    badge: {
      px: 1.5,
      py: 0.5,
      borderRadius: 0.5, // More rigid/boxy
      border: 0,
      boxShadow: theme.shadows[1],
      display: "inline-flex",
      alignItems: "center",
      "& .badge-text": {
        fontSize: "0.6875rem",
        fontWeight: 600,
        textTransform: "uppercase" as const,
        letterSpacing: "0.05em",
        textRendering: "optimizeLegibility",
      },
    },

    // Sharp section container - boxy and rigid
    section: {
      p: 4,
      borderRadius: 1, // Minimal rounding for sharp look
      border: 0,
      boxShadow: theme.shadows[1],
    },

    raw: {
      textGradient:
        mode === "dark" ? config.textGradient.dark : config.textGradient.light,
      backgroundGradient:
        mode === "dark"
          ? config.backgroundGradient.dark
          : config.backgroundGradient.light,
      accentColor:
        mode === "dark" ? config.accentColor.dark : config.accentColor.light,
      shimmer: mode === "dark" ? config.shimmer.dark : config.shimmer.light,
    },
  };
}
