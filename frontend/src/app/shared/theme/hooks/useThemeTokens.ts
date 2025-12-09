/**
 * Theme Token Access Hooks
 *
 * Provides convenient access to design tokens from the current theme.
 * Simplifies accessing nested token values without deep property drilling.
 *
 * @example
 * ```tsx
 * import { useThemeTokens, useThemeColors, useThemeShadows } from '@shared/theme/hooks';
 *
 * function MyComponent() {
 *   const { borderRadius, spacing } = useThemeTokens();
 *   const { primary, secondary } = useThemeColors();
 *   const shadows = useThemeShadows();
 *
 *   return (
 *     <Box sx={{
 *       borderRadius: borderRadius.md,
 *       p: spacing.md,
 *       backgroundColor: primary.main,
 *       boxShadow: shadows.level2,
 *     }}>
 *       Content
 *     </Box>
 *   );
 * }
 * ```
 */

import { useMemo } from "react";
import { useTheme, alpha } from "@mui/material/styles";

// ============================================================================
// TYPES
// ============================================================================

export interface ThemeColors {
  primary: {
    main: string;
    light: string;
    dark: string;
    contrastText: string;
  };
  secondary: {
    main: string;
    light: string;
    dark: string;
    contrastText: string;
  };
  tertiary: {
    main: string;
    contrastText: string;
  };
  error: {
    main: string;
    light: string;
    contrastText: string;
  };
  warning: {
    main: string;
    light: string;
    contrastText: string;
  };
  success: {
    main: string;
    light: string;
    contrastText: string;
  };
  info: {
    main: string;
    contrastText: string;
  };
  background: {
    default: string;
    paper: string;
  };
  text: {
    primary: string;
    secondary: string;
    disabled: string;
  };
  divider: string;
}

export interface ThemeBorderRadius {
  none: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  full: number;
}

export interface ThemeSpacing {
  none: number;
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
}

export interface ThemeShadows {
  none: string;
  level1: string;
  level2: string;
  level3: string;
  level4: string;
  level5: string;
}

export interface ThemeMotion {
  fast: number;
  medium: number;
  slow: number;
  easing: string;
}

// ============================================================================
// MAIN HOOK - ACCESS ALL TOKENS
// ============================================================================

/**
 * Access all theme design tokens in a structured way.
 * This is the primary hook for theme token access.
 */
export function useThemeTokens() {
  const theme = useTheme();

  return useMemo(() => {
    const tokens = theme.designTokens;

    return {
      /** Current theme mode */
      mode: theme.palette.mode,

      /** Border radius values */
      borderRadius: {
        none: 0,
        sm: tokens?.effects?.borderRadius?.sm ?? 4,
        md: tokens?.effects?.borderRadius?.md ?? 8,
        lg: tokens?.effects?.borderRadius?.lg ?? 12,
        xl: tokens?.effects?.borderRadius?.xl ?? 16,
        full: 9999,
      } as ThemeBorderRadius,

      /** Spacing scale (in px) */
      spacing: {
        none: 0,
        xs: tokens?.spacing?.scale?.xs ?? 4,
        sm: tokens?.spacing?.scale?.sm ?? 8,
        md: tokens?.spacing?.scale?.md ?? 16,
        lg: tokens?.spacing?.scale?.lg ?? 24,
        xl: tokens?.spacing?.scale?.xl ?? 32,
      } as ThemeSpacing,

      /** Shadow/elevation levels */
      shadows: {
        none: "none",
        level1: tokens?.effects?.elevation?.level1 ?? theme.shadows[1],
        level2: tokens?.effects?.elevation?.level2 ?? theme.shadows[2],
        level3: tokens?.effects?.elevation?.level3 ?? theme.shadows[4],
        level4: tokens?.effects?.elevation?.level4 ?? theme.shadows[8],
        level5: tokens?.effects?.elevation?.level5 ?? theme.shadows[12],
      } as ThemeShadows,

      /** Motion/animation timing */
      motion: {
        fast: tokens?.motion?.duration?.fast ?? 100,
        medium: tokens?.motion?.duration?.medium ?? 200,
        slow: tokens?.motion?.duration?.long ?? 400,
        easing: tokens?.motion?.easing?.standard ?? "ease-in-out",
      } as ThemeMotion,

      /** Glass effect settings (if enabled) */
      glass: tokens?.effects?.glass
        ? {
            blur: tokens.effects.glass.blur,
            opacity: tokens.effects.glass.opacity,
            saturation: tokens.effects.glass.saturation ?? 1,
          }
        : null,

      /** Glow effect settings (if enabled) */
      glow: tokens?.effects?.glow
        ? {
            color: tokens.effects.glow.color,
            spread: tokens.effects.glow.spread,
            strength: tokens.effects.glow.strength ?? 1,
          }
        : null,

      /** Raw tokens for advanced access */
      raw: tokens,
    };
  }, [theme]);
}

// ============================================================================
// COLOR-SPECIFIC HOOK
// ============================================================================

/**
 * Access theme colors in a flat, convenient structure.
 * Provides all palette colors organized by semantic meaning.
 */
export function useThemeColors(): ThemeColors {
  const theme = useTheme();

  return useMemo(
    () => ({
      primary: {
        main: theme.palette.primary.main,
        light: theme.palette.primary.light,
        dark: theme.palette.primary.dark,
        contrastText: theme.palette.primary.contrastText,
      },
      secondary: {
        main: theme.palette.secondary.main,
        light: theme.palette.secondary.light,
        dark: theme.palette.secondary.dark,
        contrastText: theme.palette.secondary.contrastText,
      },
      tertiary: {
        main: theme.palette.tertiary?.main ?? theme.palette.info.main,
        contrastText:
          theme.palette.tertiary?.contrastText ??
          theme.palette.info.contrastText,
      },
      error: {
        main: theme.palette.error.main,
        light: theme.palette.error.light,
        contrastText: theme.palette.error.contrastText,
      },
      warning: {
        main: theme.palette.warning.main,
        light: theme.palette.warning.light,
        contrastText: theme.palette.warning.contrastText,
      },
      success: {
        main: theme.palette.success.main,
        light: theme.palette.success.light,
        contrastText: theme.palette.success.contrastText,
      },
      info: {
        main: theme.palette.info.main,
        contrastText: theme.palette.info.contrastText,
      },
      background: {
        default: theme.palette.background.default,
        paper: theme.palette.background.paper,
      },
      text: {
        primary: theme.palette.text.primary,
        secondary: theme.palette.text.secondary,
        disabled: theme.palette.text.disabled,
      },
      divider: theme.palette.divider,
    }),
    [theme]
  );
}

// ============================================================================
// SHADOW-SPECIFIC HOOK
// ============================================================================

/**
 * Access theme shadows/elevation levels.
 */
export function useThemeShadows(): ThemeShadows {
  const { shadows } = useThemeTokens();
  return shadows;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create a transparent version of a color.
 * Convenience wrapper around MUI's alpha function.
 */
export function useColorAlpha() {
  return useMemo(
    () => ({
      /** Create transparent version of a color */
      alpha: (color: string, opacity: number) => alpha(color, opacity),
      /** Create very transparent (10%) version */
      subtle: (color: string) => alpha(color, 0.1),
      /** Create semi-transparent (25%) version */
      light: (color: string) => alpha(color, 0.25),
      /** Create medium transparent (50%) version */
      medium: (color: string) => alpha(color, 0.5),
      /** Create mostly opaque (75%) version */
      strong: (color: string) => alpha(color, 0.75),
    }),
    []
  );
}

// ============================================================================
// COMBINED HOOK FOR COMMON USE CASE
// ============================================================================

/**
 * Combined hook providing the most commonly used theme values.
 * Use this as the default choice for components.
 */
export function useAppTheme() {
  const theme = useTheme();
  const tokens = useThemeTokens();
  const colors = useThemeColors();
  const alphaUtils = useColorAlpha();

  return useMemo(
    () => ({
      /** The full MUI theme object */
      theme,
      /** Current mode (light/dark) */
      mode: theme.palette.mode,
      /** Is dark mode active? */
      isDark: theme.palette.mode === "dark",
      /** Color palette */
      colors,
      /** Border radius values */
      borderRadius: tokens.borderRadius,
      /** Spacing scale */
      spacing: tokens.spacing,
      /** Shadow/elevation */
      shadows: tokens.shadows,
      /** Animation timing */
      motion: tokens.motion,
      /** Glass effect (if enabled) */
      glass: tokens.glass,
      /** Glow effect (if enabled) */
      glow: tokens.glow,
      /** Alpha/transparency utilities */
      alpha: alphaUtils,
    }),
    [theme, tokens, colors, alphaUtils]
  );
}
