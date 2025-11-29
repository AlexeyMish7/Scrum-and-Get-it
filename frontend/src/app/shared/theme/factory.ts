import { createTheme, type Theme, alpha } from "@mui/material/styles";
import type { BaseTokens, DesignTokens } from "./types";
import { exportCssVars } from "./exportCssVars";

/**
 * Theme Factory
 *
 * Converts design tokens into a fully configured MUI theme.
 * This factory bridges our token-based design system with Material-UI's theming.
 *
 * Design System v2.0 - Modern, Crisp, and Cohesive
 *
 * Features:
 * - Full token support (palette, typography, spacing, effects, motion, components)
 * - Dynamic shadow depth adjustment
 * - CSS custom properties export
 * - Component-level style overrides from tokens
 * - Glass morphism effects
 * - Smooth hover transitions
 * - Consistent spacing and typography
 */

// Export CSS vars for non-MUI components that need theme values
const applyCssVars = (tokens: DesignTokens) => exportCssVars(tokens);

/**
 * Scales the alpha value in rgba() color strings by a given factor
 * Used to adjust shadow intensity for hover/active states
 */
function scaleRgbaAlpha(shadow: string, factor: number): string {
  return shadow.replace(
    /rgba\((\s*\d+\s*),(\s*\d+\s*),(\s*\d+\s*),(\s*\d*\.?\d+\s*)\)/g,
    (_m, r, g, b, a) => {
      const alphaNum = Math.max(0, Math.min(1, parseFloat(a)));
      const next = Math.max(0, Math.min(1, alphaNum * factor));
      return `rgba(${r},${g},${b},${next})`;
    }
  );
}

/**
 * Adjusts shadow intensity based on depth preset
 * - flat: no shadow
 * - subtle: reduced intensity
 * - normal: as-is
 * - strong: increased intensity
 */
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

/**
 * Builds the MUI typography configuration from our typography tokens
 */
function buildTypography(tokens: BaseTokens) {
  const typo = tokens.typography;
  const defaultFontFamily =
    "Inter, Manrope, 'SF Pro Display', -apple-system, system-ui, Roboto, Arial, sans-serif";

  return {
    fontFamily: typo?.fontFamily.body ?? defaultFontFamily,
    // Heading variants use heading font family
    h1: {
      fontFamily: typo?.fontFamily.heading ?? defaultFontFamily,
      fontSize: typo?.fontSize["5xl"] ?? "3rem",
      fontWeight: typo?.fontWeight.bold ?? 700,
      lineHeight: typo?.lineHeight.tight ?? 1.25,
      letterSpacing: typo?.letterSpacing.tight ?? "-0.02em",
    },
    h2: {
      fontFamily: typo?.fontFamily.heading ?? defaultFontFamily,
      fontSize: typo?.fontSize["4xl"] ?? "2.25rem",
      fontWeight: typo?.fontWeight.bold ?? 700,
      lineHeight: typo?.lineHeight.tight ?? 1.25,
      letterSpacing: typo?.letterSpacing.tight ?? "-0.02em",
    },
    h3: {
      fontFamily: typo?.fontFamily.heading ?? defaultFontFamily,
      fontSize: typo?.fontSize["3xl"] ?? "1.875rem",
      fontWeight: typo?.fontWeight.semibold ?? 600,
      lineHeight: typo?.lineHeight.tight ?? 1.25,
      letterSpacing: typo?.letterSpacing.normal ?? "0",
    },
    h4: {
      fontFamily: typo?.fontFamily.heading ?? defaultFontFamily,
      fontSize: typo?.fontSize["2xl"] ?? "1.5rem",
      fontWeight: typo?.fontWeight.semibold ?? 600,
      lineHeight: typo?.lineHeight.tight ?? 1.25,
    },
    h5: {
      fontFamily: typo?.fontFamily.heading ?? defaultFontFamily,
      fontSize: typo?.fontSize.xl ?? "1.25rem",
      fontWeight: typo?.fontWeight.medium ?? 500,
      lineHeight: typo?.lineHeight.normal ?? 1.5,
    },
    h6: {
      fontFamily: typo?.fontFamily.heading ?? defaultFontFamily,
      fontSize: typo?.fontSize.lg ?? "1.125rem",
      fontWeight: typo?.fontWeight.medium ?? 500,
      lineHeight: typo?.lineHeight.normal ?? 1.5,
    },
    body1: {
      fontSize: typo?.fontSize.md ?? "1rem",
      lineHeight: typo?.lineHeight.normal ?? 1.5,
    },
    body2: {
      fontSize: typo?.fontSize.sm ?? "0.875rem",
      lineHeight: typo?.lineHeight.normal ?? 1.5,
    },
    subtitle1: {
      fontSize: typo?.fontSize.md ?? "1rem",
      fontWeight: typo?.fontWeight.medium ?? 500,
      lineHeight: typo?.lineHeight.normal ?? 1.5,
    },
    subtitle2: {
      fontSize: typo?.fontSize.sm ?? "0.875rem",
      fontWeight: typo?.fontWeight.medium ?? 500,
      lineHeight: typo?.lineHeight.normal ?? 1.5,
    },
    caption: {
      fontSize: typo?.fontSize.xs ?? "0.75rem",
      lineHeight: typo?.lineHeight.normal ?? 1.5,
    },
    overline: {
      fontSize: typo?.fontSize.xs ?? "0.75rem",
      fontWeight: typo?.fontWeight.medium ?? 500,
      letterSpacing: typo?.letterSpacing.wider ?? "0.05em",
      textTransform: "uppercase" as const,
    },
    button: {
      textTransform: (tokens.components?.button?.textTransform ?? "none") as
        | "none"
        | "uppercase"
        | "capitalize",
      fontWeight: tokens.components?.button?.fontWeight ?? 600,
      letterSpacing: tokens.components?.button?.letterSpacing ?? "0.02em",
    },
  };
}

/**
 * Builds the MUI spacing function from our spacing tokens
 */
function buildSpacing(tokens: BaseTokens): number {
  // MUI uses a base unit (default 8px), we use our token unit (default 4px)
  return tokens.spacing?.unit ?? 4;
}

/**
 * Main factory function - converts design tokens to MUI theme
 */
export function createThemeFromTokens(tokens: BaseTokens): Theme {
  const base = createTheme();

  // Build shadow array with depth adjustments
  const buildShadows = (): Theme["shadows"] => {
    const elevation = tokens.effects.elevation;
    const depth = tokens.effects.depth;

    return [
      "none", // 0
      adjustDepth(elevation.level1, depth) || base.shadows[1],
      adjustDepth(elevation.level2, depth) || base.shadows[2],
      adjustDepth(elevation.level3, depth) || base.shadows[3],
      adjustDepth(elevation.level4, depth) || base.shadows[4],
      adjustDepth(elevation.level5, depth) || base.shadows[5],
      ...base.shadows.slice(6),
    ] as unknown as Theme["shadows"];
  };

  // Build glow shadow string for components
  const buildGlowShadow = (
    baseShadow: string,
    includeGlow: boolean
  ): string => {
    if (!includeGlow || !tokens.effects.glow) return baseShadow;
    const glow = tokens.effects.glow;
    return baseShadow === "none"
      ? `${glow.spread} ${glow.color}`
      : `${baseShadow}, ${glow.spread} ${glow.color}`;
  };

  const theme = createTheme({
    palette: {
      mode: tokens.mode,
      primary: {
        main: tokens.palette.primary,
        light: tokens.palette.primaryLight ?? undefined,
        dark: tokens.palette.primaryDark ?? undefined,
        contrastText: tokens.palette.onPrimary,
      },
      secondary: {
        main: tokens.palette.secondary,
        light: tokens.palette.secondaryLight ?? undefined,
        dark: tokens.palette.secondaryDark ?? undefined,
        contrastText: tokens.palette.onSecondary,
      },
      // Custom tertiary palette (declared via module augmentation)
      tertiary: {
        main: tokens.palette.tertiary,
        contrastText: tokens.palette.onTertiary,
      },
      // Info palette (often blue, distinct from primary)
      info: {
        main: tokens.palette.info ?? "#0ea5e9",
        contrastText: tokens.palette.onInfo ?? "#ffffff",
      },
      background: {
        default: tokens.palette.background,
        paper: tokens.palette.surface,
      },
      text: {
        primary: tokens.palette.text?.primary ?? tokens.palette.onSurface,
        secondary: tokens.palette.text?.secondary ?? tokens.palette.onSurface,
        disabled:
          tokens.palette.text?.disabled ??
          alpha(tokens.palette.onSurface, 0.38),
      },
      error: {
        main: tokens.palette.error,
        light: tokens.palette.errorLight ?? undefined,
        contrastText: tokens.palette.onError,
      },
      warning: {
        main: tokens.palette.warning,
        light: tokens.palette.warningLight ?? undefined,
        contrastText: tokens.palette.onWarning,
      },
      success: {
        main: tokens.palette.success,
        light: tokens.palette.successLight ?? undefined,
        contrastText: tokens.palette.onSuccess,
      },
      divider: tokens.palette.divider,
      action: {
        hoverOpacity: tokens.interaction?.hoverOpacity ?? 0.04,
        activatedOpacity: tokens.interaction?.activeOpacity ?? 0.12,
        disabledOpacity: tokens.interaction?.disabledOpacity ?? 0.38,
      },
    },

    shape: {
      borderRadius: tokens.effects.borderRadius.md,
    },

    spacing: buildSpacing(tokens),

    shadows: buildShadows(),

    typography: buildTypography(tokens),

    // Apply reduced motion when preference is set
    // When reducedMotion is true, use minimal/instant durations
    transitions: tokens.motion.reducedMotion
      ? {
          duration: {
            shortest: 0,
            shorter: 0,
            short: 0,
            standard: 0,
            complex: 0,
            enteringScreen: 0,
            leavingScreen: 0,
          },
          easing: {
            easeInOut: "linear",
            easeOut: "linear",
            easeIn: "linear",
            sharp: "linear",
          },
        }
      : {
          duration: {
            shortest: tokens.motion.duration.fast,
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
      // ============================================================
      // CARD COMPONENT - Modern glass morphism with subtle depth
      // ============================================================
      MuiCard: {
        defaultProps: {
          elevation: 0,
        },
        styleOverrides: {
          root: {
            borderRadius:
              tokens.components?.card?.borderRadius ??
              `var(--radius-lg, ${tokens.effects.borderRadius.lg}px)`,
            backgroundColor: tokens.components?.card?.bg ?? undefined,
            // Subtle border for definition
            border: tokens.components?.card?.border
              ? `1px solid ${tokens.components.card.border}`
              : `1px solid ${alpha(tokens.palette.divider, 0.5)}`,
            // Refined shadow with depth
            boxShadow: buildGlowShadow(
              tokens.components?.card?.shadow ??
                adjustDepth(
                  tokens.effects.elevation.level1,
                  tokens.effects.depth
                ) ??
                "none",
              tokens.effects.glow?.appliesTo?.card ?? false
            ),
            // Smooth transitions for all interactive properties
            transition: `
              box-shadow ${tokens.motion.duration.medium}ms ${tokens.motion.easing.standard},
              transform ${tokens.motion.duration.medium}ms ${tokens.motion.easing.standard},
              border-color ${tokens.motion.duration.short}ms ${tokens.motion.easing.standard},
              background-color ${tokens.motion.duration.short}ms ${tokens.motion.easing.standard}
            `,
            // Modern hover effect with subtle lift
            "&:hover": {
              boxShadow:
                tokens.components?.card?.hoverShadow ??
                adjustDepth(
                  tokens.effects.elevation.level2,
                  tokens.effects.depth,
                  1.2
                ),
              borderColor: alpha(tokens.palette.primary, 0.15),
            },
            // Glass morphism effect for supported surfaces
            ...(tokens.effects.glass
              ? {
                  backdropFilter: `blur(${tokens.effects.glass.blur}px) saturate(${tokens.effects.glass.saturation})`,
                  WebkitBackdropFilter: `blur(${tokens.effects.glass.blur}px) saturate(${tokens.effects.glass.saturation})`,
                }
              : {}),
          },
        },
      },

      // ============================================================
      // BUTTON COMPONENT - Crisp with subtle glow and smooth states
      // ============================================================
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
        styleOverrides: {
          root: {
            borderRadius:
              tokens.components?.button?.borderRadius ??
              `var(--radius-md, ${tokens.effects.borderRadius.md}px)`,
            minHeight: tokens.components?.button?.size?.md.height ?? 40,
            fontWeight: tokens.components?.button?.fontWeight ?? 600,
            letterSpacing: tokens.components?.button?.letterSpacing ?? "0.02em",
            textTransform: tokens.components?.button?.textTransform ?? "none",
            // Enhanced focus ring for accessibility
            "&:focus-visible": {
              outline: 0,
              boxShadow: `0 0 0 ${tokens.effects.focusRing.width}px ${tokens.effects.focusRing.color}`,
            },
            // Subtle base shadow
            boxShadow: buildGlowShadow(
              adjustDepth(
                tokens.effects.elevation.level1,
                tokens.effects.depth
              ) ?? "none",
              tokens.effects.glow?.appliesTo?.button ?? false
            ),
            // Smooth transition for all states
            transition: `
              box-shadow ${tokens.motion.duration.short}ms ${tokens.motion.easing.standard},
              transform ${tokens.motion.duration.short}ms ${tokens.motion.easing.standard},
              background-color ${tokens.motion.duration.short}ms ${tokens.motion.easing.standard},
              border-color ${tokens.motion.duration.short}ms ${tokens.motion.easing.standard}
            `,
            // Hover: subtle lift and glow
            "&:hover": {
              transform: "translateY(-1px)",
              boxShadow: buildGlowShadow(
                adjustDepth(
                  tokens.effects.elevation.level2,
                  tokens.effects.depth,
                  tokens.interaction?.hoverElevationScale ?? 1.15
                ) ?? "none",
                (tokens.effects.glow?.appliesTo?.button ?? false) ||
                  (tokens.interaction?.hoverGlow ?? false)
              ),
            },
            // Active: subtle press effect
            "&:active": {
              transform: "translateY(0px) scale(0.98)",
              boxShadow: adjustDepth(
                tokens.effects.elevation.level1,
                tokens.effects.depth,
                0.8
              ),
            },
            // Disabled state
            "&.Mui-disabled": {
              opacity: tokens.interaction?.disabledOpacity ?? 0.38,
            },
          },
          // Contained variant - primary button style
          contained: {
            boxShadow: adjustDepth(
              tokens.effects.elevation.level1,
              tokens.effects.depth
            ),
            "&:hover": {
              boxShadow: buildGlowShadow(
                adjustDepth(
                  tokens.effects.elevation.level2,
                  tokens.effects.depth,
                  1.2
                ) ?? "none",
                tokens.interaction?.hoverGlow ?? false
              ),
            },
          },
          // Outlined variant - subtle border with hover fill
          outlined: {
            borderWidth: "1.5px",
            "&:hover": {
              borderWidth: "1.5px",
              backgroundColor: alpha(tokens.palette.primary, 0.04),
            },
          },
          // Text variant - minimal style
          text: {
            "&:hover": {
              backgroundColor: alpha(tokens.palette.primary, 0.08),
            },
          },
          sizeSmall: tokens.components?.button?.size?.sm
            ? {
                height: tokens.components.button.size.sm.height,
                padding: tokens.components.button.size.sm.padding,
                fontSize: tokens.components.button.size.sm.fontSize,
                minHeight: tokens.components.button.size.sm.height,
              }
            : { minHeight: 32, padding: "6px 12px", fontSize: "0.875rem" },
          sizeLarge: tokens.components?.button?.size?.lg
            ? {
                height: tokens.components.button.size.lg.height,
                padding: tokens.components.button.size.lg.padding,
                fontSize: tokens.components.button.size.lg.fontSize,
                minHeight: tokens.components.button.size.lg.height,
              }
            : { minHeight: 48, padding: "10px 24px", fontSize: "1rem" },
        },
      },

      // ============================================================
      // TEXT FIELD COMPONENT - Clean and modern inputs
      // ============================================================
      MuiTextField: {
        defaultProps: {
          variant: "outlined",
          size: "medium",
        },
        styleOverrides: {
          root: {
            "& .MuiInputLabel-root": {
              fontSize: tokens.typography?.fontSize.sm ?? "0.875rem",
              fontWeight: tokens.typography?.fontWeight.medium ?? 500,
              "&.Mui-focused": {
                color: tokens.palette.primary,
              },
            },
          },
        },
      },

      // ============================================================
      // OUTLINED INPUT COMPONENT - Refined borders and focus states
      // ============================================================
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            backgroundColor: tokens.input?.bg ?? "transparent",
            borderRadius: tokens.effects.borderRadius.md,
            transition: `
              background-color ${tokens.motion.duration.short}ms ${tokens.motion.easing.standard},
              box-shadow ${tokens.motion.duration.short}ms ${tokens.motion.easing.standard}
            `,
            // Default fieldset border
            "& fieldset": {
              borderColor:
                tokens.input?.border ?? alpha(tokens.palette.divider, 0.8),
              borderWidth: "1.5px",
              transition: `border-color ${tokens.motion.duration.short}ms ${tokens.motion.easing.standard}`,
            },
            // Hover state - subtle border darkening
            "&:hover fieldset": {
              borderColor:
                tokens.input?.border ??
                alpha(
                  tokens.palette.onSurface,
                  tokens.mode === "light" ? 0.25 : 0.35
                ),
            },
            // Focus state - primary color border with glow
            "&.Mui-focused": {
              backgroundColor: tokens.input?.bgFocus ?? undefined,
            },
            "&.Mui-focused fieldset": {
              borderColor: tokens.input?.borderFocus ?? tokens.palette.primary,
              borderWidth: "2px",
              boxShadow: tokens.effects.glow?.appliesTo?.inputFocus
                ? `0 0 0 3px ${alpha(tokens.palette.primary, 0.15)}`
                : `0 0 0 3px ${alpha(tokens.palette.primary, 0.1)}`,
            },
            // Error state
            "&.Mui-error fieldset": {
              borderColor: tokens.input?.borderError ?? tokens.palette.error,
            },
            "&.Mui-error.Mui-focused fieldset": {
              boxShadow: `0 0 0 3px ${alpha(tokens.palette.error, 0.15)}`,
            },
            // Disabled state
            "&.Mui-disabled": {
              backgroundColor:
                tokens.input?.bgDisabled ?? alpha(tokens.palette.divider, 0.1),
              "& fieldset": {
                borderColor: alpha(tokens.palette.divider, 0.3),
              },
            },
          },
          input: {
            color: tokens.input?.text ?? undefined,
            padding: "12px 14px",
            "&::placeholder": {
              color:
                tokens.input?.placeholder ??
                alpha(tokens.palette.onSurface, 0.5),
              opacity: 1,
            },
          },
          inputSizeSmall: tokens.input?.size?.sm
            ? {
                padding: tokens.input.size.sm.padding,
                fontSize: tokens.input.size.sm.fontSize,
              }
            : { padding: "8px 12px", fontSize: "0.875rem" },
        },
      },

      // ============================================================
      // FILLED INPUT COMPONENT - Modern filled style
      // ============================================================
      MuiFilledInput: {
        styleOverrides: {
          root: {
            backgroundColor:
              tokens.input?.bg ?? alpha(tokens.palette.onSurface, 0.04),
            borderRadius: `${tokens.effects.borderRadius.md}px ${tokens.effects.borderRadius.md}px 0 0`,
            transition: `background-color ${tokens.motion.duration.short}ms ${tokens.motion.easing.standard}`,
            "&:before": {
              borderBottomColor:
                tokens.input?.border ?? alpha(tokens.palette.divider, 0.5),
            },
            "&:after": {
              borderBottomColor: tokens.palette.primary,
            },
            "&:hover": {
              backgroundColor:
                tokens.input?.bgFocus ?? alpha(tokens.palette.onSurface, 0.08),
              "&:before": {
                borderBottomColor: alpha(tokens.palette.onSurface, 0.3),
              },
            },
            "&.Mui-focused": {
              backgroundColor:
                tokens.input?.bgFocus ?? alpha(tokens.palette.onSurface, 0.06),
            },
          },
        },
      },

      // ============================================================
      // PAPER COMPONENT - Glass morphism and depth
      // ============================================================
      MuiPaper: {
        defaultProps: {
          elevation: 0,
        },
        styleOverrides: {
          root: {
            borderRadius: `var(--radius-lg, ${tokens.effects.borderRadius.lg}px)`,
            boxShadow: buildGlowShadow(
              adjustDepth(
                tokens.effects.elevation.level1,
                tokens.effects.depth
              ) ?? "none",
              tokens.effects.glow?.appliesTo?.paper ?? false
            ),
            backgroundImage: "none",
            // Subtle border for definition
            border: `1px solid ${alpha(tokens.palette.divider, 0.3)}`,
          },
          elevation1: {
            boxShadow: adjustDepth(
              tokens.effects.elevation.level1,
              tokens.effects.depth
            ),
          },
          elevation2: {
            boxShadow: adjustDepth(
              tokens.effects.elevation.level2,
              tokens.effects.depth
            ),
          },
          elevation3: {
            boxShadow: adjustDepth(
              tokens.effects.elevation.level3,
              tokens.effects.depth
            ),
          },
          elevation4: {
            boxShadow: adjustDepth(
              tokens.effects.elevation.level4,
              tokens.effects.depth
            ),
          },
        },
      },

      // ============================================================
      // CHIP COMPONENT - Refined pills with hover states
      // ============================================================
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius:
              tokens.components?.chip?.borderRadius ??
              tokens.effects.borderRadius.full,
            fontSize: tokens.components?.chip?.fontSize ?? "0.8125rem",
            fontWeight: tokens.typography?.fontWeight.medium ?? 500,
            transition: `
              background-color ${tokens.motion.duration.short}ms ${tokens.motion.easing.standard},
              box-shadow ${tokens.motion.duration.short}ms ${tokens.motion.easing.standard}
            `,
            "&:hover": {
              boxShadow: adjustDepth(
                tokens.effects.elevation.level1,
                tokens.effects.depth
              ),
            },
          },
          sizeSmall: tokens.components?.chip?.height?.sm
            ? { height: tokens.components.chip.height.sm }
            : { height: 24 },
          sizeMedium: tokens.components?.chip?.height?.md
            ? { height: tokens.components.chip.height.md }
            : { height: 32 },
          // Outlined variant
          outlined: {
            borderWidth: "1.5px",
          },
          // Filled variant with subtle depth
          filled: {
            boxShadow: "none",
            "&:hover": {
              boxShadow: adjustDepth(
                tokens.effects.elevation.level1,
                tokens.effects.depth,
                0.5
              ),
            },
          },
        },
      },

      // ============================================================
      // AVATAR COMPONENT - Clean circles with border
      // ============================================================
      MuiAvatar: {
        styleOverrides: {
          root: {
            border:
              tokens.components?.avatar?.border ??
              `2px solid ${alpha(tokens.palette.surface, 0.9)}`,
            fontWeight: tokens.typography?.fontWeight.semibold ?? 600,
          },
          colorDefault: {
            backgroundColor: alpha(tokens.palette.primary, 0.1),
            color: tokens.palette.primary,
          },
        },
      },

      // ============================================================
      // LINK COMPONENT - Subtle underline animation
      // ============================================================
      MuiLink: {
        styleOverrides: {
          root: {
            color: tokens.palette.text?.link ?? tokens.palette.primary,
            textDecoration: "none",
            fontWeight: tokens.typography?.fontWeight.medium ?? 500,
            position: "relative",
            transition: `color ${tokens.motion.duration.short}ms ${tokens.motion.easing.standard}`,
            "&:hover": {
              color:
                tokens.palette.text?.linkHover ??
                tokens.palette.primaryDark ??
                tokens.palette.primary,
            },
            // Subtle underline on hover
            "&::after": {
              content: '""',
              position: "absolute",
              bottom: -1,
              left: 0,
              width: "100%",
              height: "1.5px",
              backgroundColor: "currentColor",
              transform: "scaleX(0)",
              transformOrigin: "right",
              transition: `transform ${tokens.motion.duration.short}ms ${tokens.motion.easing.standard}`,
            },
            "&:hover::after": {
              transform: "scaleX(1)",
              transformOrigin: "left",
            },
          },
        },
      },

      // ============================================================
      // DIALOG COMPONENT - Modern modal with glass effect
      // ============================================================
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: tokens.effects.borderRadius.xl,
            boxShadow: adjustDepth(
              tokens.effects.elevation.level5,
              tokens.effects.depth
            ),
            border: `1px solid ${alpha(tokens.palette.divider, 0.2)}`,
            backgroundImage: "none",
          },
          backdrop: {
            backgroundColor:
              tokens.effects.overlay?.backdropColor ?? alpha("#000", 0.5),
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          },
        },
      },

      // ============================================================
      // DIALOG TITLE - Consistent heading style
      // ============================================================
      MuiDialogTitle: {
        styleOverrides: {
          root: {
            fontSize: tokens.typography?.fontSize["xl"] ?? "1.25rem",
            fontWeight: tokens.typography?.fontWeight.semibold ?? 600,
            padding: "20px 24px 12px",
          },
        },
      },

      // ============================================================
      // DIALOG CONTENT - Proper spacing
      // ============================================================
      MuiDialogContent: {
        styleOverrides: {
          root: {
            padding: "12px 24px 20px",
          },
        },
      },

      // ============================================================
      // DIALOG ACTIONS - Consistent button spacing
      // ============================================================
      MuiDialogActions: {
        styleOverrides: {
          root: {
            padding: "12px 24px 20px",
            gap: 8,
          },
        },
      },

      // ============================================================
      // TOOLTIP COMPONENT - Clean and readable
      // ============================================================
      MuiTooltip: {
        defaultProps: {
          arrow: true,
        },
        styleOverrides: {
          tooltip: {
            borderRadius: tokens.effects.borderRadius.md,
            fontSize: tokens.typography?.fontSize.xs ?? "0.75rem",
            fontWeight: tokens.typography?.fontWeight.medium ?? 500,
            padding: "8px 12px",
            boxShadow: adjustDepth(
              tokens.effects.elevation.level2,
              tokens.effects.depth
            ),
          },
          arrow: {
            "&::before": {
              boxShadow: adjustDepth(
                tokens.effects.elevation.level1,
                tokens.effects.depth
              ),
            },
          },
        },
      },

      // ============================================================
      // APP BAR COMPONENT - Glass morphism header
      // ============================================================
      MuiAppBar: {
        styleOverrides: {
          root: tokens.palette.appBar
            ? {
                backgroundColor: alpha(
                  tokens.palette.appBar.bg,
                  tokens.palette.appBar.glassOpacity ?? 0.85
                ),
                color: tokens.palette.appBar.color,
                borderBottom: tokens.palette.appBar.border
                  ? `1px solid ${tokens.palette.appBar.border}`
                  : undefined,
                backdropFilter: tokens.palette.appBar.blur
                  ? `blur(${tokens.palette.appBar.blur}px) saturate(1.2)`
                  : undefined,
                WebkitBackdropFilter: tokens.palette.appBar.blur
                  ? `blur(${tokens.palette.appBar.blur}px) saturate(1.2)`
                  : undefined,
                boxShadow: "none",
              }
            : undefined,
        },
      },

      // ============================================================
      // DRAWER COMPONENT (Sidebar) - Clean navigation
      // ============================================================
      MuiDrawer: {
        styleOverrides: {
          paper: tokens.palette.sidebar
            ? {
                backgroundColor: tokens.palette.sidebar.bg,
                color: tokens.palette.sidebar.color,
                borderRight: tokens.palette.sidebar.border
                  ? `1px solid ${tokens.palette.sidebar.border}`
                  : undefined,
                backgroundImage: "none",
              }
            : undefined,
        },
      },

      // ============================================================
      // LIST ITEM BUTTON - Navigation items with hover
      // ============================================================
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: tokens.effects.borderRadius.md,
            margin: "2px 8px",
            padding: "8px 12px",
            transition: `
              background-color ${tokens.motion.duration.short}ms ${tokens.motion.easing.standard},
              color ${tokens.motion.duration.short}ms ${tokens.motion.easing.standard}
            `,
            "&:hover": {
              backgroundColor:
                tokens.palette.sidebar?.hoverItemBg ??
                alpha(tokens.palette.primary, 0.08),
            },
            "&.Mui-selected": {
              backgroundColor:
                tokens.palette.sidebar?.activeItemBg ??
                alpha(tokens.palette.primary, 0.12),
              color: tokens.palette.primary,
              "&:hover": {
                backgroundColor: alpha(tokens.palette.primary, 0.16),
              },
            },
          },
        },
      },

      // ============================================================
      // TAB COMPONENT - Clean tab navigation
      // ============================================================
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: "none",
            fontWeight: tokens.typography?.fontWeight.medium ?? 500,
            fontSize: tokens.typography?.fontSize.sm ?? "0.875rem",
            minHeight: 44,
            transition: `color ${tokens.motion.duration.short}ms ${tokens.motion.easing.standard}`,
            "&.Mui-selected": {
              fontWeight: tokens.typography?.fontWeight.semibold ?? 600,
            },
          },
        },
      },

      // ============================================================
      // TABS COMPONENT - Modern indicator
      // ============================================================
      MuiTabs: {
        styleOverrides: {
          indicator: {
            height: 3,
            borderRadius: "3px 3px 0 0",
          },
        },
      },

      // ============================================================
      // ALERT COMPONENT - Refined notification boxes
      // ============================================================
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: tokens.effects.borderRadius.md,
            border: "1px solid",
            padding: "12px 16px",
          },
          standardSuccess: {
            borderColor: alpha(tokens.palette.success, 0.3),
            backgroundColor: alpha(tokens.palette.success, 0.08),
          },
          standardError: {
            borderColor: alpha(tokens.palette.error, 0.3),
            backgroundColor: alpha(tokens.palette.error, 0.08),
          },
          standardWarning: {
            borderColor: alpha(tokens.palette.warning, 0.3),
            backgroundColor: alpha(tokens.palette.warning, 0.08),
          },
          standardInfo: {
            borderColor: alpha(
              tokens.palette.info ?? tokens.palette.primary,
              0.3
            ),
            backgroundColor: alpha(
              tokens.palette.info ?? tokens.palette.primary,
              0.08
            ),
          },
        },
      },

      // ============================================================
      // ICON BUTTON - Consistent sizing and hover
      // ============================================================
      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: tokens.effects.borderRadius.md,
            transition: `
              background-color ${tokens.motion.duration.short}ms ${tokens.motion.easing.standard},
              transform ${tokens.motion.duration.short}ms ${tokens.motion.easing.standard}
            `,
            "&:hover": {
              backgroundColor: alpha(tokens.palette.primary, 0.08),
              transform: "scale(1.05)",
            },
            "&:active": {
              transform: "scale(0.95)",
            },
          },
        },
      },

      // ============================================================
      // DIVIDER - Subtle separation
      // ============================================================
      MuiDivider: {
        styleOverrides: {
          root: {
            borderColor: alpha(tokens.palette.divider, 0.6),
          },
        },
      },

      // ============================================================
      // SKELETON - Loading placeholder animation
      // ============================================================
      MuiSkeleton: {
        styleOverrides: {
          root: {
            backgroundColor:
              tokens.components?.skeleton?.bg ??
              alpha(tokens.palette.onSurface, 0.08),
            borderRadius: tokens.effects.borderRadius.sm,
          },
          rectangular: {
            borderRadius: tokens.effects.borderRadius.md,
          },
        },
      },

      // ============================================================
      // MENU - Dropdown menus
      // ============================================================
      MuiMenu: {
        styleOverrides: {
          paper: {
            borderRadius: tokens.effects.borderRadius.lg,
            boxShadow: adjustDepth(
              tokens.effects.elevation.level3,
              tokens.effects.depth
            ),
            border: `1px solid ${alpha(tokens.palette.divider, 0.3)}`,
            marginTop: 4,
          },
        },
      },

      // ============================================================
      // MENU ITEM - Dropdown items
      // ============================================================
      MuiMenuItem: {
        styleOverrides: {
          root: {
            borderRadius: tokens.effects.borderRadius.sm,
            margin: "2px 6px",
            padding: "8px 12px",
            transition: `background-color ${tokens.motion.duration.short}ms ${tokens.motion.easing.standard}`,
            "&:hover": {
              backgroundColor: alpha(tokens.palette.primary, 0.08),
            },
            "&.Mui-selected": {
              backgroundColor: alpha(tokens.palette.primary, 0.12),
              "&:hover": {
                backgroundColor: alpha(tokens.palette.primary, 0.16),
              },
            },
          },
        },
      },

      // ============================================================
      // SWITCH - Toggle switch styling
      // ============================================================
      MuiSwitch: {
        styleOverrides: {
          root: {
            padding: 8,
          },
          track: {
            borderRadius: 11,
            opacity: 0.3,
          },
          thumb: {
            boxShadow: adjustDepth(
              tokens.effects.elevation.level1,
              tokens.effects.depth
            ),
          },
          switchBase: {
            "&.Mui-checked": {
              "& + .MuiSwitch-track": {
                opacity: 0.5,
              },
            },
          },
        },
      },

      // ============================================================
      // CIRCULAR PROGRESS - Loading spinner
      // ============================================================
      MuiCircularProgress: {
        styleOverrides: {
          root: {
            // Subtle drop shadow for depth
            filter: `drop-shadow(0 1px 2px ${alpha(
              tokens.palette.primary,
              0.2
            )})`,
          },
        },
      },

      // ============================================================
      // LINEAR PROGRESS - Progress bar
      // ============================================================
      MuiLinearProgress: {
        styleOverrides: {
          root: {
            borderRadius: tokens.effects.borderRadius.full,
            height: 6,
          },
          bar: {
            borderRadius: tokens.effects.borderRadius.full,
          },
        },
      },

      // ============================================================
      // SNACKBAR - Toast notifications
      // ============================================================
      MuiSnackbar: {
        styleOverrides: {
          root: {
            "& .MuiSnackbarContent-root": {
              borderRadius: tokens.effects.borderRadius.md,
              boxShadow: adjustDepth(
                tokens.effects.elevation.level3,
                tokens.effects.depth
              ),
            },
          },
        },
      },

      // ============================================================
      // TABLE - Data tables
      // ============================================================
      MuiTableHead: {
        styleOverrides: {
          root: {
            backgroundColor:
              tokens.components?.table?.headerBg ??
              alpha(tokens.palette.background, 0.8),
            "& .MuiTableCell-head": {
              fontWeight: tokens.typography?.fontWeight.semibold ?? 600,
              color:
                tokens.components?.table?.headerColor ??
                tokens.palette.text?.primary,
              borderBottom: `2px solid ${
                tokens.components?.table?.borderColor ?? tokens.palette.divider
              }`,
            },
          },
        },
      },

      MuiTableRow: {
        styleOverrides: {
          root: {
            transition: `background-color ${tokens.motion.duration.short}ms ${tokens.motion.easing.standard}`,
            "&:hover": {
              backgroundColor:
                tokens.components?.table?.rowHoverBg ??
                alpha(tokens.palette.primary, 0.04),
            },
          },
        },
      },

      MuiTableCell: {
        styleOverrides: {
          root: {
            padding: tokens.components?.table?.cellPadding ?? "12px 16px",
            borderBottom: `1px solid ${
              tokens.components?.table?.borderColor ??
              alpha(tokens.palette.divider, 0.6)
            }`,
          },
        },
      },
    },
  });

  // Attach design tokens to theme for runtime access
  (theme as unknown as { designTokens: unknown }).designTokens =
    tokens as unknown;

  // Export CSS custom properties for non-MUI components
  applyCssVars(tokens);

  // Set additional CSS variables on document root
  if (typeof document !== "undefined") {
    const root = document.documentElement;

    // Input tokens
    if (tokens.input?.bg) root.style.setProperty("--input-bg", tokens.input.bg);
    if (tokens.input?.border)
      root.style.setProperty("--input-border", tokens.input.border);
    if (tokens.input?.borderFocus)
      root.style.setProperty("--input-border-focus", tokens.input.borderFocus);

    // Border radius tokens
    root.style.setProperty("--radius-none", "0");
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
    root.style.setProperty(
      "--radius-xl",
      `${tokens.effects.borderRadius.xl}px`
    );
    root.style.setProperty(
      "--radius-full",
      `${tokens.effects.borderRadius.full}px`
    );

    // Spacing tokens
    if (tokens.spacing) {
      root.style.setProperty("--spacing-unit", `${tokens.spacing.unit}px`);
      root.style.setProperty("--spacing-xs", `${tokens.spacing.scale.xs}px`);
      root.style.setProperty("--spacing-sm", `${tokens.spacing.scale.sm}px`);
      root.style.setProperty("--spacing-md", `${tokens.spacing.scale.md}px`);
      root.style.setProperty("--spacing-lg", `${tokens.spacing.scale.lg}px`);
      root.style.setProperty("--spacing-xl", `${tokens.spacing.scale.xl}px`);
    }

    // Typography tokens
    if (tokens.typography) {
      root.style.setProperty(
        "--font-heading",
        tokens.typography.fontFamily.heading
      );
      root.style.setProperty("--font-body", tokens.typography.fontFamily.body);
      root.style.setProperty("--font-mono", tokens.typography.fontFamily.mono);
    }

    // Motion tokens
    root.style.setProperty(
      "--duration-fast",
      `${tokens.motion.duration.fast}ms`
    );
    root.style.setProperty(
      "--duration-short",
      `${tokens.motion.duration.short}ms`
    );
    root.style.setProperty(
      "--duration-medium",
      `${tokens.motion.duration.medium}ms`
    );
    root.style.setProperty(
      "--duration-long",
      `${tokens.motion.duration.long}ms`
    );
    root.style.setProperty("--easing-standard", tokens.motion.easing.standard);
    root.style.setProperty(
      "--easing-emphasized",
      tokens.motion.easing.emphasized
    );

    // Color tokens
    root.style.setProperty("--color-primary", tokens.palette.primary);
    root.style.setProperty("--color-secondary", tokens.palette.secondary);
    root.style.setProperty("--color-background", tokens.palette.background);
    root.style.setProperty("--color-surface", tokens.palette.surface);
    root.style.setProperty("--color-divider", tokens.palette.divider);
  }

  return theme;
}

export default createThemeFromTokens;
