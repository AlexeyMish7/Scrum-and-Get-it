import { createTheme, type Theme } from "@mui/material/styles";
import type { BaseTokens, DesignTokens } from "./types";
import { exportCssVars } from "./exportCssVars";

// Kept for backward compatibility in case factory is imported elsewhere; delegate to helper
const applyCssVars = (tokens: DesignTokens) => exportCssVars(tokens);

export function createThemeFromTokens(tokens: BaseTokens): Theme {
  // Create a base theme and then override selective pieces with tokens
  const base = createTheme();

  const theme = createTheme({
    palette: {
      mode: tokens.mode,
      primary: {
        main: tokens.palette.primary,
        contrastText: tokens.palette.onPrimary,
      },
      secondary: {
        main: tokens.palette.secondary,
        contrastText: tokens.palette.onSecondary,
      },
      // Custom palette key declared via module augmentation
      tertiary: {
        main: tokens.palette.tertiary,
        contrastText: tokens.palette.onTertiary,
      },
      background: {
        default: tokens.palette.background,
        paper: tokens.palette.surface,
      },
      text: {
        primary: tokens.palette.onSurface,
        secondary: tokens.palette.onSurface,
        disabled: tokens.palette.onSurface,
      },
      error: {
        main: tokens.palette.error,
        contrastText: tokens.palette.onError,
      },
      warning: {
        main: tokens.palette.warning,
        contrastText: tokens.palette.onWarning,
      },
      success: {
        main: tokens.palette.success,
        contrastText: tokens.palette.onSuccess,
      },
      divider: tokens.palette.divider,
    },
    shape: { borderRadius: tokens.effects.borderRadius.md },
    shadows: [
      base.shadows[0],
      tokens.effects.elevation.level1,
      tokens.effects.elevation.level2,
      tokens.effects.elevation.level3,
      tokens.effects.elevation.level4 ?? base.shadows[4],
      tokens.effects.elevation.level5 ?? base.shadows[5],
      ...base.shadows.slice(6),
    ] as unknown as Theme["shadows"],
    typography: {
      fontFamily:
        "Inter, Manrope, 'SF Pro Display', -apple-system, system-ui, Roboto, Arial, sans-serif",
      button: {
        textTransform: "none",
        fontWeight: 600,
        letterSpacing: "0.02em",
      },
    },
    transitions: {
      duration: {
        shortest: tokens.motion.duration.short,
        shorter: tokens.motion.duration.short,
        short: tokens.motion.duration.medium,
        standard: tokens.motion.duration.medium,
        complex: tokens.motion.duration.long,
        enteringScreen: tokens.motion.duration.medium,
        leavingScreen: tokens.motion.duration.short,
      },
      easing: {
        easeInOut: tokens.motion.easing.standard,
        easeOut: tokens.motion.easing.decelerate,
        easeIn: tokens.motion.easing.accelerate,
        sharp: tokens.motion.easing.emphasized,
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: tokens.effects.borderRadius.md,
            minHeight: 44,
            fontWeight: 600,
            letterSpacing: "0.02em",
            "&:focus-visible": {
              outline: 0,
              boxShadow: `0 0 0 ${tokens.effects.focusRing.width}px ${tokens.effects.focusRing.color}`,
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: tokens.effects.borderRadius.lg,
            boxShadow: tokens.effects.elevation.level1,
          },
        },
      },
    },
  });

  // Attach our tokens to the theme (typed via augmentation)
  // Assign tokens to theme.designTokens without assuming a specific prior augmentation shape
  (theme as unknown as { designTokens: unknown }).designTokens =
    tokens as unknown;

  // Export a few CSS vars for non-MUI areas
  applyCssVars(tokens);

  return theme;
}

export default createThemeFromTokens;
