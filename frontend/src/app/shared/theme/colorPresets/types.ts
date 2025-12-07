/**
 * Color Preset Types
 *
 * Color presets define ONLY the color palette for a theme.
 * They are mode-agnostic - each color preset auto-generates
 * light and dark variants based on the base colors.
 */

/**
 * Color preset identifier
 * These are the available color schemes users can choose from
 */
export type ColorPresetId =
  | "default" // Standard blue/orange professional
  | "ocean" // Teals, cyans, calming blues
  | "forest" // Greens, earth tones, natural
  | "sunset" // Warm oranges, reds, corals
  | "rose" // Pinks, magentas, elegant
  | "lavender" // Purples, soft violets
  | "slate" // Neutral grays, minimal
  | "mint"; // Fresh greens, minty

/**
 * Core color values that define a color scheme
 * These are the "seed" colors that generate the full palette
 */
export interface ColorPresetColors {
  /** Primary brand color - main actions, links, focus */
  primary: string;
  /** Secondary accent color - supporting actions */
  secondary: string;
  /** Tertiary accent - rarely used, additional variety */
  tertiary?: string;
}

/**
 * Extended palette generated from core colors
 * These are derived colors used throughout the UI
 */
export interface ColorPresetPalette {
  // Core colors
  primary: string;
  primaryLight: string;
  primaryDark: string;
  onPrimary: string;

  secondary: string;
  secondaryLight: string;
  secondaryDark: string;
  onSecondary: string;

  tertiary?: string;
  onTertiary?: string;

  // Semantic colors (can be customized per preset)
  info?: string;
  success?: string;
  warning?: string;
  error?: string;
}

/**
 * Light mode specific colors
 */
export interface ColorPresetLightMode {
  background: string;
  backgroundAlt: string;
  surface: string;
  surfaceAlt: string;
  onBackground: string;
  onSurface: string;
  divider: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textDisabled: string;
}

/**
 * Dark mode specific colors
 */
export interface ColorPresetDarkMode {
  background: string;
  backgroundAlt: string;
  surface: string;
  surfaceAlt: string;
  onBackground: string;
  onSurface: string;
  divider: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textDisabled: string;
}

/**
 * Complete color preset definition
 */
export interface ColorPreset {
  /** Unique identifier */
  id: ColorPresetId;
  /** Display name */
  name: string;
  /** Short description */
  description: string;
  /** Core colors that define the palette */
  colors: ColorPresetColors;
  /** Full palette derived from core colors */
  palette: ColorPresetPalette;
  /** Light mode specific overrides */
  light: ColorPresetLightMode;
  /** Dark mode specific overrides */
  dark: ColorPresetDarkMode;
}

/**
 * Collection of all color presets
 */
export type ColorPresetCollection = Record<ColorPresetId, ColorPreset>;
