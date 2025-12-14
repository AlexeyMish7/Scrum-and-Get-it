/**
 * Theme Barrel Export
 *
 * Re-exports light and dark theme instances created from design tokens.
 * These are global themes used across all workspaces.
 *
 * New System (v2):
 * - Mode: light | dark (determines base palette)
 * - Color Preset: Colors only (8 presets)
 * - Design Preset: Shapes and effects only (6 presets)
 *
 * Use composeTheme() from ./composer for the new system.
 * Use useAppTheme() hook for convenient token access in components.
 */

export { default as lightTheme } from "./lightTheme";
export { default as darkTheme } from "./darkTheme";
export type { ThemeMode } from "./types";

// New theme composition system - separates colors from design effects
export {
  composeTheme,
  composeTokens,
  getColorPresetIds,
  getDesignPresetIds,
  isValidColorPreset,
  isValidDesignPreset,
  type ComposeThemeOptions,
} from "./composer";

// Color presets - define color schemes only
export * from "./colorPresets";

// Design presets - define shapes, effects, motion only
export * from "./designPresets";

// Theme hooks - convenient token access
export * from "./hooks";

// Theme utilities - color manipulation, gradients
export * from "./utils";

// AI Glossy Styles - for AI-generated content
export * from "./aiGlossy";

// Theme preview components - for settings UI
export * from "./components";

// Legacy theme presets (for backwards compatibility)
export * from "./presets";
