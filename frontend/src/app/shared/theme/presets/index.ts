/**
 * Theme Presets
 *
 * Pre-configured theme presets for quick theme switching.
 */

// Types
export type {
  PresetId,
  PresetCategory,
  PresetMetadata,
  ThemePreset,
  PresetCollection,
} from "./types";

// Preset definitions
export {
  professionalLight,
  professionalDark,
  creativeLight,
  creativeDark,
  oceanLight,
  oceanDark,
  forestLight,
  forestDark,
  sunsetLight,
  sunsetDark,
  roseLight,
  roseDark,
  accessibleLight,
  accessibleDark,
  minimalLight,
  minimalDark,
  allPresets,
  presetsByCategory,
  presetsById,
} from "./presets";

// Application functions
export {
  applyPresetById,
  applyPreset,
  getPreset,
  getPresetMeta,
  isValidPreset,
} from "./apply";
