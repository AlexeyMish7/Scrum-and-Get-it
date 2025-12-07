/**
 * Design Presets Barrel Export
 */

export type {
  DesignPresetId,
  DesignPreset,
  DesignBorderRadius,
  DesignElevation,
  DesignGlow,
  DesignGlass,
  DesignFocusRing,
  DesignMotion,
  DesignPresetCollection,
} from "./types";

export {
  modernDesign,
  softDesign,
  sharpDesign,
  glassDesign,
  boldDesign,
  minimalDesign,
  allDesignPresets,
  designPresetsById,
  getDesignPreset,
  isValidDesignPreset,
} from "./presets";
