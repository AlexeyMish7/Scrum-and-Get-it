/**
 * Theme Composer
 *
 * Composes a complete theme from three independent layers:
 * 1. Mode (light/dark) - Determines the base palette
 * 2. Color Preset - Overrides color values only
 * 3. Design Preset - Overrides shapes, effects, and motion
 *
 * This separation allows users to mix and match any color scheme
 * with any design style, creating many combinations from fewer presets.
 */

import type { Theme } from "@mui/material/styles";
import type { BaseTokens, ThemeMode } from "./types";
import type { ColorPresetId, ColorPreset } from "./colorPresets/types";
import type { DesignPresetId, DesignPreset } from "./designPresets/types";
import { colorPresetsById, getColorPreset } from "./colorPresets";
import { designPresetsById, getDesignPreset } from "./designPresets";
import lightPaletteTokens from "./palettes/lightPalette";
import darkPaletteTokens from "./palettes/darkPalette";
import { createThemeFromTokens } from "./factory";

// ============================================================================
// COLOR UTILITY FUNCTIONS
// ============================================================================

/**
 * Converts a hex color to RGB components
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Converts RGB components to hex
 */
function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const clamped = Math.max(0, Math.min(255, Math.round(n)));
    return clamped.toString(16).padStart(2, "0");
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Adjusts the brightness of a hex color by a percentage
 * Positive values lighten, negative values darken
 */
function adjustColorBrightness(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const factor = percent / 100;
  if (factor > 0) {
    // Lighten: move towards white
    return rgbToHex(
      rgb.r + (255 - rgb.r) * factor,
      rgb.g + (255 - rgb.g) * factor,
      rgb.b + (255 - rgb.b) * factor
    );
  } else {
    // Darken: move towards black
    return rgbToHex(
      rgb.r * (1 + factor),
      rgb.g * (1 + factor),
      rgb.b * (1 + factor)
    );
  }
}

/**
 * Calculates the relative luminance of a color
 */
function getLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;

  const [r, g, b] = [rgb.r / 255, rgb.g / 255, rgb.b / 255].map((c) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Returns appropriate contrast text color (black or white) for a background
 */
function getContrastTextColor(backgroundColor: string): string {
  const luminance = getLuminance(backgroundColor);
  // Use WCAG contrast threshold
  return luminance > 0.179 ? "#000000" : "#ffffff";
}

// ============================================================================
// COLOR PRESET APPLICATION
// ============================================================================

/**
 * Applies a color preset to base tokens.
 * SUBTLE MODE: Only modifies accent colors (primary/secondary), borders, and highlights.
 * Background and surface colors remain controlled by light/dark mode for consistency.
 */
function applyColorPreset(
  baseTokens: BaseTokens,
  colorPreset: ColorPreset,
  mode: ThemeMode
): BaseTokens {
  const modeColors = mode === "light" ? colorPreset.light : colorPreset.dark;
  const { palette } = colorPreset;

  return {
    ...baseTokens,
    palette: {
      ...baseTokens.palette,

      // Apply core accent colors from the preset (PRIMARY/SECONDARY only)
      primary: palette.primary,
      onPrimary: palette.onPrimary,
      primaryLight: palette.primaryLight,
      primaryDark: palette.primaryDark,

      secondary: palette.secondary,
      onSecondary: palette.onSecondary,
      secondaryLight: palette.secondaryLight,
      secondaryDark: palette.secondaryDark,

      // Keep tertiary subtle or use base
      tertiary: palette.tertiary ?? baseTokens.palette.tertiary,
      onTertiary: palette.onTertiary ?? baseTokens.palette.onTertiary,

      // Semantic colors remain from base (consistent across presets)
      error: baseTokens.palette.error,
      warning: baseTokens.palette.warning,
      success: baseTokens.palette.success,
      info: baseTokens.palette.info,

      // KEEP base mode backgrounds/surfaces (don't let presets change these!)
      background: baseTokens.palette.background,
      onBackground: baseTokens.palette.onBackground,
      backgroundAlt: baseTokens.palette.backgroundAlt,
      surface: baseTokens.palette.surface,
      surfaceAlt: baseTokens.palette.surfaceAlt,
      onSurface: baseTokens.palette.onSurface,

      // Subtle preset influence on borders and dividers only
      divider: modeColors.divider,
      border: modeColors.border,

      // Text colors stay with base mode (not preset-dependent)
      text: {
        primary: baseTokens.palette.text?.primary ?? modeColors.textPrimary,
        secondary:
          baseTokens.palette.text?.secondary ?? modeColors.textSecondary,
        tertiary: baseTokens.palette.text?.tertiary ?? modeColors.textTertiary,
        disabled: baseTokens.palette.text?.disabled ?? modeColors.textDisabled,
        inverse: baseTokens.palette.text?.inverse ?? "#ffffff",
        // Links use preset primary for accent
        link: palette.primary,
        linkHover: palette.primaryDark,
      },
    },
  };
}

// ============================================================================
// DESIGN PRESET APPLICATION
// ============================================================================

/**
 * Applies a design preset to base tokens.
 * Only modifies effects, motion, and component styling - not colors.
 */
function applyDesignPreset(
  baseTokens: BaseTokens,
  designPreset: DesignPreset
): BaseTokens {
  return {
    ...baseTokens,

    effects: {
      ...baseTokens.effects,

      // Border radius
      borderRadius: {
        none: designPreset.borderRadius.none,
        sm: designPreset.borderRadius.sm,
        md: designPreset.borderRadius.md,
        lg: designPreset.borderRadius.lg,
        xl: designPreset.borderRadius.xl,
        full: designPreset.borderRadius.full,
      },

      // Elevation/shadows
      elevation: {
        none: designPreset.elevation.none,
        level1: designPreset.elevation.level1,
        level2: designPreset.elevation.level2,
        level3: designPreset.elevation.level3,
        level4: designPreset.elevation.level4,
        level5: designPreset.elevation.level5,
      },

      // Depth preset
      depth: designPreset.depth,

      // Focus ring
      focusRing: {
        ...baseTokens.effects.focusRing,
        width: designPreset.focusRing.width,
        offset: designPreset.focusRing.offset,
        style: designPreset.focusRing.style,
      },

      // Glow effect (color will be set by primary color later)
      glow: designPreset.glow.enabled
        ? {
            color: baseTokens.effects.glow?.color ?? "rgba(99, 102, 241, 0.3)",
            spread: designPreset.glow.spread,
            strength: designPreset.glow.strength,
            appliesTo: {
              button: designPreset.glow.appliesTo.button,
              card: designPreset.glow.appliesTo.card,
              inputFocus: designPreset.glow.appliesTo.input,
              link: designPreset.glow.appliesTo.link,
            },
          }
        : undefined,

      // Glass morphism
      glass: designPreset.glass.enabled
        ? {
            blur: designPreset.glass.blur,
            opacity: designPreset.glass.opacity,
            saturation: designPreset.glass.saturation,
          }
        : undefined,
    },

    // Motion settings
    motion: {
      ...baseTokens.motion,
      duration: {
        ...baseTokens.motion.duration,
        fast: designPreset.motion.duration.fast,
        medium: designPreset.motion.duration.medium,
        long: designPreset.motion.duration.slow,
      },
      easing: {
        ...baseTokens.motion.easing,
        standard: designPreset.motion.easing.standard,
        emphasized: designPreset.motion.easing.emphasized,
        decelerate: designPreset.motion.easing.decelerate,
        accelerate: designPreset.motion.easing.accelerate,
      },
    },

    // Component-specific styling
    components: {
      ...baseTokens.components,
      button: {
        ...baseTokens.components?.button,
        borderRadius: designPreset.borderRadius.md,
      },
      card: {
        ...baseTokens.components?.card,
        borderRadius: designPreset.borderRadius.lg,
        // Use design preset elevation so surfaces visually match the selected design style.
        shadow: designPreset.elevation.level1,
        hoverShadow: designPreset.elevation.level2,
      },
    },

    // Interaction settings
    interaction: {
      ...baseTokens.interaction,
      hoverOpacity: baseTokens.interaction?.hoverOpacity ?? 0.04,
      activeOpacity: baseTokens.interaction?.activeOpacity ?? 0.12,
      disabledOpacity: baseTokens.interaction?.disabledOpacity ?? 0.38,
      hoverGlow: designPreset.glow.appliesTo.button,
      hoverElevationScale: designPreset.depth === "strong" ? 1.3 : 1.15,
    },
  };
}

// ============================================================================
// MAIN COMPOSER FUNCTION
// ============================================================================

export interface ComposeThemeOptions {
  /** Light or dark mode */
  mode: ThemeMode;
  /** Color preset ID */
  colorPresetId: ColorPresetId;
  /** Design preset ID */
  designPresetId: DesignPresetId;
  /** Custom accent color override (hex) - overrides the color preset's primary */
  customAccentColor?: string | null;
  /** Reduced motion preference - disables animations */
  reducedMotion?: boolean;
}

/**
 * Composes a complete MUI theme from mode, color preset, and design preset.
 *
 * This is the main entry point for creating themes with the new system.
 *
 * @example
 * ```ts
 * import { composeTheme } from '@shared/theme/composer';
 *
 * const theme = composeTheme({
 *   mode: 'dark',
 *   colorPresetId: 'ocean',
 *   designPresetId: 'glass',
 * });
 * ```
 */
export function composeTheme(options: ComposeThemeOptions): Theme {
  const {
    mode,
    colorPresetId,
    designPresetId,
    customAccentColor,
    reducedMotion,
  } = options;

  // Start with base tokens for the selected mode
  const baseTokens = mode === "light" ? lightPaletteTokens : darkPaletteTokens;

  // Get the presets
  const colorPreset = getColorPreset(colorPresetId);
  const designPreset = getDesignPreset(designPresetId);

  // Apply presets in order: color first, then design
  let tokens = { ...baseTokens };

  if (colorPreset) {
    tokens = applyColorPreset(tokens, colorPreset, mode);
  }

  if (designPreset) {
    tokens = applyDesignPreset(tokens, designPreset);
  }

  // Apply custom accent color if provided (overrides color preset primary)
  if (customAccentColor) {
    // Generate lighter/darker variants from the custom color
    const lighterVariant = adjustColorBrightness(customAccentColor, 20);
    const darkerVariant = adjustColorBrightness(customAccentColor, -20);
    const contrastText = getContrastTextColor(customAccentColor);

    tokens.palette = {
      ...tokens.palette,
      primary: customAccentColor,
      primaryLight: lighterVariant,
      primaryDark: darkerVariant,
      onPrimary: contrastText,
    };

    // Update text link colors if they exist
    if (tokens.palette.text) {
      tokens.palette.text = {
        ...tokens.palette.text,
        link: customAccentColor,
        linkHover: darkerVariant,
      };
    }
  }

  // Apply reduced motion if enabled - set all durations to 0
  if (reducedMotion) {
    tokens.motion = {
      ...tokens.motion,
      duration: {
        instant: 0,
        fast: 0,
        short: 0,
        medium: 0,
        long: 0,
        slower: 0,
      },
    };
  }

  // Ensure mode is set correctly
  tokens.mode = mode;

  // Update glow color to match the primary color from the color preset
  if (tokens.effects.glow) {
    // Create a semi-transparent version of the primary color for glow
    tokens.effects.glow.color = `${tokens.palette.primary}40`; // 40 = 25% opacity in hex
  }

  // Update focus ring color to match primary
  tokens.effects.focusRing.color = `${tokens.palette.primary}60`; // 60 = 37% opacity

  // Create the MUI theme from the composed tokens
  return createThemeFromTokens(tokens);
}

/**
 * Get the base tokens without creating a full MUI theme.
 * Useful for accessing token values directly.
 */
export function composeTokens(options: ComposeThemeOptions): BaseTokens {
  const { mode, colorPresetId, designPresetId } = options;

  const baseTokens = mode === "light" ? lightPaletteTokens : darkPaletteTokens;
  const colorPreset = getColorPreset(colorPresetId);
  const designPreset = getDesignPreset(designPresetId);

  let tokens = { ...baseTokens };

  if (colorPreset) {
    tokens = applyColorPreset(tokens, colorPreset, mode);
  }

  if (designPreset) {
    tokens = applyDesignPreset(tokens, designPreset);
  }

  tokens.mode = mode;

  return tokens;
}

/**
 * Get all valid color preset IDs
 */
export function getColorPresetIds(): ColorPresetId[] {
  return Object.keys(colorPresetsById) as ColorPresetId[];
}

/**
 * Get all valid design preset IDs
 */
export function getDesignPresetIds(): DesignPresetId[] {
  return Object.keys(designPresetsById) as DesignPresetId[];
}

// Re-export validation functions for convenience
export { isValidColorPreset } from "./colorPresets";
export { isValidDesignPreset } from "./designPresets";
