/**
 * Color Utilities
 *
 * Utility functions for working with colors in the theme system.
 * Includes gradient generation, color manipulation, and contrast calculations.
 */

import { alpha } from "@mui/material/styles";

// ============================================================================
// GRADIENT GENERATION
// ============================================================================

export type GradientDirection =
  | "to-right"
  | "to-left"
  | "to-top"
  | "to-bottom"
  | "to-top-right"
  | "to-top-left"
  | "to-bottom-right"
  | "to-bottom-left"
  | "radial"
  | "conic";

const directionMap: Record<GradientDirection, string> = {
  "to-right": "90deg",
  "to-left": "270deg",
  "to-top": "0deg",
  "to-bottom": "180deg",
  "to-top-right": "45deg",
  "to-top-left": "315deg",
  "to-bottom-right": "135deg",
  "to-bottom-left": "225deg",
  radial: "radial",
  conic: "conic",
};

/**
 * Generate a linear gradient from two or more colors.
 *
 * @example
 * ```ts
 * createGradient(['#3b82f6', '#8b5cf6']); // "linear-gradient(135deg, #3b82f6, #8b5cf6)"
 * createGradient(['#3b82f6', '#8b5cf6'], 'to-right'); // "linear-gradient(90deg, #3b82f6, #8b5cf6)"
 * ```
 */
export function createGradient(
  colors: string[],
  direction: GradientDirection = "to-bottom-right"
): string {
  if (colors.length < 2) {
    return colors[0] ?? "transparent";
  }

  if (direction === "radial") {
    return `radial-gradient(circle, ${colors.join(", ")})`;
  }

  if (direction === "conic") {
    return `conic-gradient(from 0deg, ${colors.join(", ")})`;
  }

  return `linear-gradient(${directionMap[direction]}, ${colors.join(", ")})`;
}

/**
 * Generate a gradient from primary to secondary color.
 */
export function createPrimaryGradient(
  primary: string,
  secondary: string,
  direction: GradientDirection = "to-bottom-right"
): string {
  return createGradient([primary, secondary], direction);
}

/**
 * Generate a subtle background gradient for surfaces.
 * Uses very low opacity for a subtle effect.
 */
export function createSurfaceGradient(
  primary: string,
  direction: GradientDirection = "to-bottom-right"
): string {
  return createGradient(
    [alpha(primary, 0.02), alpha(primary, 0.08)],
    direction
  );
}

/**
 * Generate a glass-like gradient overlay.
 */
export function createGlassGradient(baseColor: string = "#ffffff"): string {
  return `linear-gradient(
    135deg,
    ${alpha(baseColor, 0.1)} 0%,
    ${alpha(baseColor, 0.05)} 50%,
    ${alpha(baseColor, 0.02)} 100%
  )`;
}

/**
 * Generate a shimmer/shine gradient for loading states.
 */
export function createShimmerGradient(baseColor: string = "#ffffff"): string {
  return `linear-gradient(
    90deg,
    transparent 0%,
    ${alpha(baseColor, 0.3)} 50%,
    transparent 100%
  )`;
}

// ============================================================================
// COLOR MANIPULATION
// ============================================================================

/**
 * Lighten a hex color by a percentage.
 *
 * @param hex - Hex color string
 * @param percent - Percentage to lighten (0-100)
 */
export function lighten(hex: string, percent: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, (num >> 16) + amt);
  const G = Math.min(255, ((num >> 8) & 0x00ff) + amt);
  const B = Math.min(255, (num & 0x0000ff) + amt);
  return `#${((1 << 24) | (R << 16) | (G << 8) | B).toString(16).slice(1)}`;
}

/**
 * Darken a hex color by a percentage.
 *
 * @param hex - Hex color string
 * @param percent - Percentage to darken (0-100)
 */
export function darken(hex: string, percent: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, (num >> 16) - amt);
  const G = Math.max(0, ((num >> 8) & 0x00ff) - amt);
  const B = Math.max(0, (num & 0x0000ff) - amt);
  return `#${((1 << 24) | (R << 16) | (G << 8) | B).toString(16).slice(1)}`;
}

/**
 * Convert hex color to RGB object.
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

/**
 * Convert RGB to hex color.
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

/**
 * Get luminance of a color (for contrast calculations).
 * Returns a value between 0 (black) and 1 (white).
 */
export function getLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors.
 * Returns a value between 1 (no contrast) and 21 (maximum contrast).
 */
export function getContrastRatio(color1: string, color2: string): number {
  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Determine if a color is "dark" based on luminance.
 */
export function isDark(hex: string): boolean {
  return getLuminance(hex) < 0.5;
}

/**
 * Get the best contrast text color (black or white) for a background.
 */
export function getContrastText(background: string): string {
  return isDark(background) ? "#ffffff" : "#000000";
}

// ============================================================================
// PALETTE GENERATION
// ============================================================================

/**
 * Generate a full palette from a single primary color.
 * Creates light, main, and dark variants.
 */
export function generatePaletteFromColor(primary: string) {
  return {
    light: lighten(primary, 20),
    main: primary,
    dark: darken(primary, 20),
    contrastText: getContrastText(primary),
  };
}

/**
 * Generate complementary color (opposite on color wheel).
 */
export function getComplementary(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(255 - r, 255 - g, 255 - b);
}

// ============================================================================
// CSS COLOR UTILITIES
// ============================================================================

/**
 * Create a CSS box-shadow glow effect.
 */
export function createGlowShadow(
  color: string,
  spread: number = 12,
  opacity: number = 0.3
): string {
  return `0 0 ${spread}px ${alpha(color, opacity)}`;
}

/**
 * Create a multi-layer shadow for depth.
 */
export function createLayeredShadow(
  color: string = "#000000",
  intensity: "subtle" | "normal" | "strong" = "normal"
): string {
  const opacities = {
    subtle: [0.02, 0.04],
    normal: [0.06, 0.1],
    strong: [0.1, 0.15],
  };
  const [o1, o2] = opacities[intensity];

  return `
    0 1px 2px ${alpha(color, o1)},
    0 4px 8px ${alpha(color, o2)}
  `.trim();
}
