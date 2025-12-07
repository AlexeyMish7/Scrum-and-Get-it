/**
 * Theme Preset Types
 *
 * Defines types for theme preset system, including preset metadata
 * and partial token overrides.
 */

import type { BaseTokens } from "../types";

/**
 * Theme preset identifier
 */
export type PresetId =
  | "professional-light"
  | "professional-dark"
  | "creative-light"
  | "creative-dark"
  | "accessible-light"
  | "accessible-dark"
  | "minimal-light"
  | "minimal-dark"
  | "ocean-light"
  | "ocean-dark"
  | "forest-light"
  | "forest-dark"
  | "sunset-light"
  | "sunset-dark"
  | "rose-light"
  | "rose-dark";

/**
 * Preset category for organizing presets
 */
export type PresetCategory =
  | "professional"
  | "creative"
  | "accessible"
  | "minimal"
  | "ocean"
  | "forest"
  | "sunset"
  | "rose";

/**
 * Partial token override for presets
 * Deep partial allows overriding any token property
 */
export type PresetTokens = DeepPartial<BaseTokens>;

/**
 * Metadata about a theme preset
 */
export interface PresetMetadata {
  /** Unique preset identifier */
  id: PresetId;
  /** Human-readable preset name */
  name: string;
  /** Preset description */
  description: string;
  /** Preset category for grouping */
  category: PresetCategory;
  /** Whether this is a dark or light preset */
  mode: "light" | "dark";
  /** Author/creator of preset */
  author?: string;
  /** Tags for searchability */
  tags?: string[];
  /** Preview image URL (optional) */
  previewUrl?: string;
}

/**
 * Complete theme preset with metadata and tokens
 */
export interface ThemePreset {
  /** Preset metadata */
  meta: PresetMetadata;
  /** Token overrides for this preset */
  tokens: PresetTokens;
}

/**
 * Preset collection grouped by category and mode
 */
export interface PresetCollection {
  [category: string]: {
    light?: ThemePreset;
    dark?: ThemePreset;
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Utility Types
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Deep partial type for nested objects
 */
type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;
