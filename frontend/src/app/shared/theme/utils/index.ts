/**
 * Theme Utilities Barrel Export
 */

export {
  // Gradient generation
  createGradient,
  createPrimaryGradient,
  createSurfaceGradient,
  createGlassGradient,
  createShimmerGradient,
  type GradientDirection,
  // Color manipulation
  lighten,
  darken,
  hexToRgb,
  rgbToHex,
  getLuminance,
  getContrastRatio,
  isDark,
  getContrastText,
  // Palette generation
  generatePaletteFromColor,
  getComplementary,
  // CSS utilities
  createGlowShadow,
  createLayeredShadow,
} from "./colorUtils";
