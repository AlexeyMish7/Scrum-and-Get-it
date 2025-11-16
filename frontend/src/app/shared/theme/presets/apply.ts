/**
 * Theme Preset Application Logic
 *
 * Applies preset themes by generating MUI themes from preset tokens.
 */

import type { Theme } from "@mui/material/styles";
import type { PresetId, ThemePreset } from "./types";
import type { BaseTokens } from "../types";
import { createThemeFromTokens } from "../factory";
import { presetsById } from "./presets";

/**
 * Apply a theme preset by ID
 *
 * Creates a complete MUI theme from the preset's tokens merged with base tokens.
 *
 * @param presetId - ID of the preset to apply
 * @param baseTokens - Base design tokens to use as fallback for unspecified values
 * @returns Complete MUI theme with preset applied
 * @throws Error if preset ID is not found
 *
 * @example
 * ```ts
 * import { applyPresetById } from '@shared/theme/presets';
 * import { lightPalette } from '@shared/theme/palettes/lightPalette';
 *
 * const theme = applyPresetById('creative-light', lightPalette);
 * ```
 */
export function applyPresetById(
  presetId: PresetId,
  baseTokens: BaseTokens
): Theme {
  const preset = presetsById[presetId];

  if (!preset) {
    throw new Error(`Theme preset not found: ${presetId}`);
  }

  return applyPreset(preset, baseTokens);
}

/**
 * Apply a theme preset object
 *
 * Creates a complete MUI theme from the preset's tokens merged with base tokens.
 *
 * @param preset - Preset object with metadata and token overrides
 * @param baseTokens - Base design tokens to use as fallback for unspecified values
 * @returns Complete MUI theme with preset applied
 *
 * @example
 * ```ts
 * import { applyPreset, creativeLight } from '@shared/theme/presets';
 * import { lightPalette } from '@shared/theme/palettes/lightPalette';
 *
 * const theme = applyPreset(creativeLight, lightPalette);
 * ```
 */
export function applyPreset(
  preset: ThemePreset,
  baseTokens: BaseTokens
): Theme {
  // Build complete tokens by merging preset with base
  // Presets are partial but typed as DeepPartial; we trust they have complete values
  const completeTokens: BaseTokens = {
    mode: preset.meta.mode,
    palette: (preset.tokens.palette ??
      baseTokens.palette) as BaseTokens["palette"],
    effects: (preset.tokens.effects ??
      baseTokens.effects) as BaseTokens["effects"],
    motion: (preset.tokens.motion ?? baseTokens.motion) as BaseTokens["motion"],
    interaction: (preset.tokens.interaction ??
      baseTokens.interaction) as BaseTokens["interaction"],
    input: (preset.tokens.input ?? baseTokens.input) as BaseTokens["input"],
  };

  // Generate MUI theme from complete tokens
  return createThemeFromTokens(completeTokens);
}

/**
 * Get a preset by ID without applying it
 *
 * Useful for displaying preset metadata or previewing preset tokens.
 *
 * @param presetId - ID of the preset to retrieve
 * @returns Preset object or undefined if not found
 *
 * @example
 * ```ts
 * import { getPreset } from '@shared/theme/presets';
 *
 * const preset = getPreset('professional-light');
 * console.log(preset?.meta.name); // "Professional Light"
 * ```
 */
export function getPreset(presetId: PresetId): ThemePreset | undefined {
  return presetsById[presetId];
}

/**
 * Get preset metadata by ID
 *
 * Convenience function to retrieve just the metadata without token overrides.
 *
 * @param presetId - ID of the preset
 * @returns Preset metadata or undefined if not found
 *
 * @example
 * ```ts
 * import { getPresetMeta } from '@shared/theme/presets';
 *
 * const meta = getPresetMeta('accessible-dark');
 * console.log(meta?.description); // "High contrast dark theme..."
 * ```
 */
export function getPresetMeta(presetId: PresetId) {
  return presetsById[presetId]?.meta;
}

/**
 * Check if a preset ID is valid
 *
 * @param presetId - Potential preset ID to check
 * @returns True if the preset exists
 *
 * @example
 * ```ts
 * import { isValidPreset } from '@shared/theme/presets';
 *
 * if (isValidPreset('creative-light')) {
 *   // Safe to use preset
 * }
 * ```
 */
export function isValidPreset(presetId: string): presetId is PresetId {
  return presetId in presetsById;
}
