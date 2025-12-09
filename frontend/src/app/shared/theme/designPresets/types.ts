/**
 * Design Preset Types
 *
 * Design presets define the SHAPE and EFFECT characteristics of a theme.
 * They are completely color-agnostic and work with any color preset.
 *
 * Design presets control:
 * - Border radius (sharp vs rounded)
 * - Shadow depth and style
 * - Glow effects
 * - Glass/blur effects
 * - Animation characteristics
 */

/**
 * Design preset identifier
 * These define the visual "feel" independent of colors
 */
export type DesignPresetId =
  | "modern" // Clean, medium radius, subtle shadows
  | "soft" // Large radius, soft shadows, gentle
  | "sharp" // Minimal radius, crisp edges
  | "glass" // Glassmorphism, blur effects, translucency
  | "bold" // Strong shadows, prominent effects
  | "minimal"; // Flat, almost no shadows, clean

/**
 * Border radius configuration
 */
export interface DesignBorderRadius {
  none: number; // 0
  sm: number; // Small elements (chips, badges)
  md: number; // Medium elements (buttons, inputs)
  lg: number; // Large elements (cards, modals)
  xl: number; // Extra large (hero sections)
  full: number; // Pill/circle shape (9999)
}

/**
 * Shadow/elevation configuration
 */
export interface DesignElevation {
  none: string;
  level1: string; // Subtle - cards at rest
  level2: string; // Medium - dropdowns, hovers
  level3: string; // Strong - modals, popovers
  level4: string; // Very strong - dialogs
  level5: string; // Maximum - tooltips, overlays
}

/**
 * Glow effect configuration
 * Color is derived from the color preset's primary color
 */
export interface DesignGlow {
  /** Whether glow effects are enabled */
  enabled: boolean;
  /** Glow blur spread (e.g., "0 0 12px") */
  spread: string;
  /** Glow intensity multiplier (0.5 = subtle, 1.5 = strong) */
  strength: number;
  /** Which components get glow effects */
  appliesTo: {
    button: boolean;
    card: boolean;
    input: boolean;
    link: boolean;
  };
}

/**
 * Glass/blur effect configuration
 */
export interface DesignGlass {
  /** Whether glass effects are enabled */
  enabled: boolean;
  /** Backdrop blur amount in px */
  blur: number;
  /** Surface opacity (0-1) */
  opacity: number;
  /** Backdrop saturation (1 = normal) */
  saturation: number;
}

/**
 * Focus ring configuration
 */
export interface DesignFocusRing {
  /** Ring width in px */
  width: number;
  /** Offset from element in px */
  offset: number;
  /** Ring style */
  style: "solid" | "dashed";
}

/**
 * Motion/animation configuration
 */
export interface DesignMotion {
  /** Transition durations in ms */
  duration: {
    fast: number; // Micro interactions
    medium: number; // Standard transitions
    slow: number; // Complex animations
  };
  /** Easing curves */
  easing: {
    standard: string;
    emphasized: string;
    decelerate: string;
    accelerate: string;
  };
}

/**
 * Complete design preset definition
 */
export interface DesignPreset {
  /** Unique identifier */
  id: DesignPresetId;
  /** Display name */
  name: string;
  /** Short description */
  description: string;
  /** Border radius configuration */
  borderRadius: DesignBorderRadius;
  /** Shadow/elevation configuration */
  elevation: DesignElevation;
  /** Depth intensity: flat, subtle, normal, strong */
  depth: "flat" | "subtle" | "normal" | "strong";
  /** Glow effect configuration */
  glow: DesignGlow;
  /** Glass effect configuration */
  glass: DesignGlass;
  /** Focus ring configuration */
  focusRing: DesignFocusRing;
  /** Motion/animation configuration */
  motion: DesignMotion;
}

/**
 * Collection of all design presets
 */
export type DesignPresetCollection = Record<DesignPresetId, DesignPreset>;
