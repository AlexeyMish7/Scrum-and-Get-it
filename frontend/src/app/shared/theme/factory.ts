import { createTheme, type Theme, alpha } from "@mui/material/styles";
import type { BaseTokens, DesignTokens } from "./types";
import { exportCssVars } from "./exportCssVars";

// Kept for backward compatibility in case factory is imported elsewhere; delegate to helper
const applyCssVars = (tokens: DesignTokens) => exportCssVars(tokens);

function scaleRgbaAlpha(shadow: string, factor: number): string {
  // Scales alpha in rgba(...) occurrences by factor, clamped to [0,1]
  return shadow.replace(
    /rgba\((\s*\d+\s*),(\s*\d+\s*),(\s*\d+\s*),(\s*\d*\.?\d+\s*)\)/g,
    (_m, r, g, b, a) => {
      const alphaNum = Math.max(0, Math.min(1, parseFloat(a)));
      const next = Math.max(0, Math.min(1, alphaNum * factor));
      return `rgba(${r},${g},${b},${next})`;
    }
  );
}

function adjustDepth(
  shadow: string | undefined,
  depth?: "flat" | "subtle" | "normal" | "strong",
  factor = 1
): string | undefined {
  if (!shadow) return shadow;
  switch (depth) {
    case "flat":
      return "none";
    case "subtle":
      return scaleRgbaAlpha(shadow, 0.6 * factor);
    case "strong":
      return scaleRgbaAlpha(shadow, 1.25 * factor);
    case "normal":
    default:
      return factor === 1 ? shadow : scaleRgbaAlpha(shadow, factor);
  }
}

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
      action: {
        hoverOpacity: tokens.interaction?.hoverOpacity ?? 0.04,
        activatedOpacity: tokens.interaction?.activeOpacity ?? 0.12,
      },
    },
    shape: { borderRadius: tokens.effects.borderRadius.md },
    shadows: [
      base.shadows[0],
      adjustDepth(tokens.effects.elevation.level1, tokens.effects.depth) ||
        base.shadows[1],
      adjustDepth(tokens.effects.elevation.level2, tokens.effects.depth) ||
        base.shadows[2],
      adjustDepth(tokens.effects.elevation.level3, tokens.effects.depth) ||
        base.shadows[3],
      adjustDepth(
        tokens.effects.elevation.level4 ?? base.shadows[4],
        tokens.effects.depth
      ) || base.shadows[4],
      adjustDepth(
        tokens.effects.elevation.level5 ?? base.shadows[5],
        tokens.effects.depth
      ) || base.shadows[5],
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
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: `var(--radius-lg, ${tokens.effects.borderRadius.lg}px)`,
            boxShadow: (() => {
              const baseShadow =
                adjustDepth(
                  tokens.effects.elevation.level1,
                  tokens.effects.depth
                ) || "none";
              if (tokens.effects.glow?.appliesTo?.card) {
                return `${baseShadow === "none" ? "" : baseShadow + ", "}${
                  tokens.effects.glow.spread
                } ${tokens.effects.glow.color}`;
              }
              return baseShadow;
            })(),
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: `var(--radius-md, ${tokens.effects.borderRadius.md}px)`,
            minHeight: 44,
            fontWeight: 600,
            letterSpacing: "0.02em",
            "&:focus-visible": {
              outline: 0,
              boxShadow: `0 0 0 ${tokens.effects.focusRing.width}px ${tokens.effects.focusRing.color}`,
            },
            boxShadow: (() => {
              const baseShadow =
                adjustDepth(
                  tokens.effects.elevation.level1,
                  tokens.effects.depth
                ) || "none";
              if (tokens.effects.glow?.appliesTo?.button) {
                return `${baseShadow === "none" ? "" : baseShadow + ", "}${
                  tokens.effects.glow.spread
                } ${tokens.effects.glow.color}`;
              }
              return baseShadow;
            })(),
            transition: `box-shadow ${tokens.motion.duration.short}ms ${tokens.motion.easing.standard}, transform ${tokens.motion.duration.short}ms ${tokens.motion.easing.standard}, background-color ${tokens.motion.duration.short}ms ${tokens.motion.easing.standard}`,
            "&:hover": {
              backgroundColor: tokens.interaction?.hoverOverlay,
              boxShadow: (() => {
                const scaled =
                  adjustDepth(
                    tokens.effects.elevation.level2,
                    tokens.effects.depth,
                    tokens.interaction?.hoverElevationScale ?? 1
                  ) || "none";
                const wantGlow =
                  (tokens.effects.glow?.appliesTo?.button ?? false) ||
                  (tokens.interaction?.hoverGlow ?? false);
                if (wantGlow) {
                  return `${scaled === "none" ? "" : scaled + ", "}${
                    tokens.effects.glow?.spread ?? "0 0 0"
                  } ${tokens.effects.glow?.color ?? "transparent"}`;
                }
                return scaled;
              })(),
            },
            "&:active": {
              backgroundColor: tokens.interaction?.activeOverlay,
              transform: tokens.interaction?.pressTransform ?? undefined,
              boxShadow: (() => {
                const scaled =
                  adjustDepth(
                    tokens.effects.elevation.level3,
                    tokens.effects.depth,
                    tokens.interaction?.activeElevationScale ?? 1
                  ) || "none";
                const wantGlow =
                  (tokens.effects.glow?.appliesTo?.button ?? false) ||
                  (tokens.interaction?.activeGlow ?? false);
                if (wantGlow) {
                  return `${scaled === "none" ? "" : scaled + ", "}${
                    tokens.effects.glow?.spread ?? "0 0 0"
                  } ${tokens.effects.glow?.color ?? "transparent"}`;
                }
                return scaled;
              })(),
            },
          },
        },
      },
      MuiTextField: {
        defaultProps: {
          variant: "outlined",
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            backgroundColor: tokens.input?.bg ?? undefined,
            "& fieldset": {
              borderColor: tokens.input?.border ?? undefined,
            },
            "&:hover fieldset": {
              borderColor:
                tokens.input?.border ??
                alpha("#000", tokens.mode === "light" ? 0.2 : 0.3),
            },
            "&.Mui-focused fieldset": {
              borderColor: tokens.palette.primary,
              boxShadow: tokens.effects.glow?.appliesTo?.inputFocus
                ? `0 0 0 ${tokens.effects.focusRing.width}px ${tokens.effects.focusRing.color}, ${tokens.effects.glow.spread} ${tokens.effects.glow.color}`
                : `0 0 0 ${tokens.effects.focusRing.width}px ${tokens.effects.focusRing.color}`,
            },
          },
          input: {
            // Ensure readable text on custom bg
            WebkitTextFillColor: undefined,
          },
        },
      },
      MuiFilledInput: {
        styleOverrides: {
          root: {
            backgroundColor: tokens.input?.bg ?? undefined,
            "&:before, &:after": {
              borderBottomColor: tokens.input?.border ?? undefined,
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: `var(--radius-lg, ${tokens.effects.borderRadius.lg}px)`,
            boxShadow: (() => {
              const baseShadow =
                adjustDepth(
                  tokens.effects.elevation.level1,
                  tokens.effects.depth
                ) || "none";
              if (tokens.effects.glow?.appliesTo?.paper) {
                return `${baseShadow === "none" ? "" : baseShadow + ", "}${
                  tokens.effects.glow.spread
                } ${tokens.effects.glow.color}`;
              }
              return baseShadow;
            })(),
          },
        },
      },
    },
  });

  // Attach our tokens to the theme (typed via augmentation)
  (theme as unknown as { designTokens: unknown }).designTokens =
    tokens as unknown;

  // Export a few CSS vars for non-MUI areas
  applyCssVars(tokens);

  // Expose CSS vars for non-MUI areas (no runtime toggles; theme-driven only)
  if (typeof document !== "undefined") {
    const root = document.documentElement;
    if (tokens.input?.bg) root.style.setProperty("--input-bg", tokens.input.bg);
    if (tokens.input?.border)
      root.style.setProperty("--input-border", tokens.input.border);
    root.style.setProperty(
      "--radius-sm",
      `${tokens.effects.borderRadius.sm}px`
    );
    root.style.setProperty(
      "--radius-md",
      `${tokens.effects.borderRadius.md}px`
    );
    root.style.setProperty(
      "--radius-lg",
      `${tokens.effects.borderRadius.lg}px`
    );
  }

  return theme;
}

export default createThemeFromTokens;
