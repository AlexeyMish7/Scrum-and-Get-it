/**
 * Color Preset Definitions
 *
 * Each color preset defines a cohesive color palette.
 * Light and dark mode variants are defined for each preset.
 */

import type {
  ColorPreset,
  ColorPresetId,
  ColorPresetCollection,
} from "./types";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DEFAULT - Professional Blue & Orange
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const defaultPreset: ColorPreset = {
  id: "default",
  name: "Default",
  description: "Professional blue with warm orange accents",
  colors: {
    primary: "#3b82f6", // Blue 500
    secondary: "#f97316", // Orange 500
    tertiary: "#06b6d4", // Cyan 500
  },
  palette: {
    primary: "#3b82f6",
    primaryLight: "#60a5fa",
    primaryDark: "#2563eb",
    onPrimary: "#ffffff",
    secondary: "#f97316",
    secondaryLight: "#fb923c",
    secondaryDark: "#ea580c",
    onSecondary: "#ffffff",
    tertiary: "#06b6d4",
    onTertiary: "#ffffff",
    info: "#0ea5e9",
    success: "#22c55e",
    warning: "#eab308",
    error: "#ef4444",
  },
  light: {
    background: "#f8fafc",
    backgroundAlt: "#f1f5f9",
    surface: "#ffffff",
    surfaceAlt: "#f8fafc",
    onBackground: "#0f172a",
    onSurface: "#1e293b",
    divider: "rgba(59, 130, 246, 0.08)",
    border: "rgba(59, 130, 246, 0.12)",
    textPrimary: "#0f172a",
    textSecondary: "#475569",
    textTertiary: "#64748b",
    textDisabled: "#94a3b8",
  },
  dark: {
    background: "#0f172a",
    backgroundAlt: "#1e293b",
    surface: "rgba(30, 41, 59, 0.95)",
    surfaceAlt: "rgba(51, 65, 85, 0.8)",
    onBackground: "#f1f5f9",
    onSurface: "#e2e8f0",
    divider: "rgba(96, 165, 250, 0.1)",
    border: "rgba(96, 165, 250, 0.15)",
    textPrimary: "#f1f5f9",
    textSecondary: "#94a3b8",
    textTertiary: "#64748b",
    textDisabled: "#475569",
  },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// OCEAN - Calming Teals & Cyans
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const oceanPreset: ColorPreset = {
  id: "ocean",
  name: "Ocean",
  description: "Calming teals and deep sea blues",
  colors: {
    primary: "#0891b2", // Cyan 600
    secondary: "#0ea5e9", // Sky 500
    tertiary: "#14b8a6", // Teal 500
  },
  palette: {
    primary: "#0891b2",
    primaryLight: "#22d3ee",
    primaryDark: "#0e7490",
    onPrimary: "#ffffff",
    secondary: "#0ea5e9",
    secondaryLight: "#38bdf8",
    secondaryDark: "#0284c7",
    onSecondary: "#ffffff",
    tertiary: "#14b8a6",
    onTertiary: "#ffffff",
    info: "#06b6d4",
    success: "#10b981",
    warning: "#f59e0b",
    error: "#f43f5e",
  },
  light: {
    background: "#f0fdfa",
    backgroundAlt: "#ccfbf1",
    surface: "#ffffff",
    surfaceAlt: "#f0fdfa",
    onBackground: "#134e4a",
    onSurface: "#115e59",
    divider: "rgba(8, 145, 178, 0.1)",
    border: "rgba(8, 145, 178, 0.15)",
    textPrimary: "#134e4a",
    textSecondary: "#0f766e",
    textTertiary: "#14b8a6",
    textDisabled: "#5eead4",
  },
  dark: {
    background: "#042f2e",
    backgroundAlt: "#134e4a",
    surface: "rgba(19, 78, 74, 0.9)",
    surfaceAlt: "rgba(15, 118, 110, 0.6)",
    onBackground: "#ccfbf1",
    onSurface: "#99f6e4",
    divider: "rgba(34, 211, 238, 0.12)",
    border: "rgba(34, 211, 238, 0.18)",
    textPrimary: "#ccfbf1",
    textSecondary: "#5eead4",
    textTertiary: "#2dd4bf",
    textDisabled: "#14b8a6",
  },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FOREST - Natural Greens
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const forestPreset: ColorPreset = {
  id: "forest",
  name: "Forest",
  description: "Natural greens and earth tones",
  colors: {
    primary: "#16a34a", // Green 600
    secondary: "#84cc16", // Lime 500
    tertiary: "#a3e635", // Lime 400
  },
  palette: {
    primary: "#16a34a",
    primaryLight: "#22c55e",
    primaryDark: "#15803d",
    onPrimary: "#ffffff",
    secondary: "#84cc16",
    secondaryLight: "#a3e635",
    secondaryDark: "#65a30d",
    onSecondary: "#1a2e05",
    tertiary: "#a3e635",
    onTertiary: "#1a2e05",
    info: "#0ea5e9",
    success: "#10b981",
    warning: "#eab308",
    error: "#dc2626",
  },
  light: {
    background: "#f0fdf4",
    backgroundAlt: "#dcfce7",
    surface: "#ffffff",
    surfaceAlt: "#f0fdf4",
    onBackground: "#14532d",
    onSurface: "#166534",
    divider: "rgba(22, 163, 74, 0.1)",
    border: "rgba(22, 163, 74, 0.15)",
    textPrimary: "#14532d",
    textSecondary: "#166534",
    textTertiary: "#15803d",
    textDisabled: "#86efac",
  },
  dark: {
    background: "#052e16",
    backgroundAlt: "#14532d",
    surface: "rgba(20, 83, 45, 0.9)",
    surfaceAlt: "rgba(22, 101, 52, 0.6)",
    onBackground: "#dcfce7",
    onSurface: "#bbf7d0",
    divider: "rgba(74, 222, 128, 0.12)",
    border: "rgba(74, 222, 128, 0.18)",
    textPrimary: "#dcfce7",
    textSecondary: "#86efac",
    textTertiary: "#4ade80",
    textDisabled: "#22c55e",
  },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SUNSET - Warm Oranges & Reds
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const sunsetPreset: ColorPreset = {
  id: "sunset",
  name: "Sunset",
  description: "Warm oranges and coral tones",
  colors: {
    primary: "#ea580c", // Orange 600
    secondary: "#f97316", // Orange 500
    tertiary: "#fbbf24", // Amber 400
  },
  palette: {
    primary: "#ea580c",
    primaryLight: "#f97316",
    primaryDark: "#c2410c",
    onPrimary: "#ffffff",
    secondary: "#f97316",
    secondaryLight: "#fb923c",
    secondaryDark: "#ea580c",
    onSecondary: "#ffffff",
    tertiary: "#fbbf24",
    onTertiary: "#451a03",
    info: "#0ea5e9",
    success: "#22c55e",
    warning: "#eab308",
    error: "#dc2626",
  },
  light: {
    background: "#fff7ed",
    backgroundAlt: "#ffedd5",
    surface: "#ffffff",
    surfaceAlt: "#fff7ed",
    onBackground: "#431407",
    onSurface: "#7c2d12",
    divider: "rgba(234, 88, 12, 0.1)",
    border: "rgba(234, 88, 12, 0.15)",
    textPrimary: "#431407",
    textSecondary: "#7c2d12",
    textTertiary: "#9a3412",
    textDisabled: "#fdba74",
  },
  dark: {
    background: "#1c0a00",
    backgroundAlt: "#431407",
    surface: "rgba(67, 20, 7, 0.9)",
    surfaceAlt: "rgba(124, 45, 18, 0.6)",
    onBackground: "#ffedd5",
    onSurface: "#fed7aa",
    divider: "rgba(251, 146, 60, 0.12)",
    border: "rgba(251, 146, 60, 0.18)",
    textPrimary: "#ffedd5",
    textSecondary: "#fdba74",
    textTertiary: "#fb923c",
    textDisabled: "#f97316",
  },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ROSE - Elegant Pinks
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const rosePreset: ColorPreset = {
  id: "rose",
  name: "Rose",
  description: "Elegant pinks and soft magentas",
  colors: {
    primary: "#e11d48", // Rose 600
    secondary: "#ec4899", // Pink 500
    tertiary: "#f472b6", // Pink 400
  },
  palette: {
    primary: "#e11d48",
    primaryLight: "#f43f5e",
    primaryDark: "#be123c",
    onPrimary: "#ffffff",
    secondary: "#ec4899",
    secondaryLight: "#f472b6",
    secondaryDark: "#db2777",
    onSecondary: "#ffffff",
    tertiary: "#f472b6",
    onTertiary: "#500724",
    info: "#0ea5e9",
    success: "#22c55e",
    warning: "#eab308",
    error: "#dc2626",
  },
  light: {
    background: "#fff1f2",
    backgroundAlt: "#ffe4e6",
    surface: "#ffffff",
    surfaceAlt: "#fff1f2",
    onBackground: "#4c0519",
    onSurface: "#881337",
    divider: "rgba(225, 29, 72, 0.1)",
    border: "rgba(225, 29, 72, 0.15)",
    textPrimary: "#4c0519",
    textSecondary: "#881337",
    textTertiary: "#9f1239",
    textDisabled: "#fda4af",
  },
  dark: {
    background: "#1a0008",
    backgroundAlt: "#4c0519",
    surface: "rgba(76, 5, 25, 0.9)",
    surfaceAlt: "rgba(136, 19, 55, 0.6)",
    onBackground: "#ffe4e6",
    onSurface: "#fecdd3",
    divider: "rgba(251, 113, 133, 0.12)",
    border: "rgba(251, 113, 133, 0.18)",
    textPrimary: "#ffe4e6",
    textSecondary: "#fda4af",
    textTertiary: "#fb7185",
    textDisabled: "#f43f5e",
  },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LAVENDER - Soft Purples
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const lavenderPreset: ColorPreset = {
  id: "lavender",
  name: "Lavender",
  description: "Soft purples and creative violets",
  colors: {
    primary: "#7c3aed", // Violet 600
    secondary: "#a855f7", // Purple 500
    tertiary: "#c084fc", // Purple 400
  },
  palette: {
    primary: "#7c3aed",
    primaryLight: "#8b5cf6",
    primaryDark: "#6d28d9",
    onPrimary: "#ffffff",
    secondary: "#a855f7",
    secondaryLight: "#c084fc",
    secondaryDark: "#9333ea",
    onSecondary: "#ffffff",
    tertiary: "#c084fc",
    onTertiary: "#3b0764",
    info: "#0ea5e9",
    success: "#22c55e",
    warning: "#eab308",
    error: "#ef4444",
  },
  light: {
    background: "#faf5ff",
    backgroundAlt: "#f3e8ff",
    surface: "#ffffff",
    surfaceAlt: "#faf5ff",
    onBackground: "#2e1065",
    onSurface: "#4c1d95",
    divider: "rgba(124, 58, 237, 0.1)",
    border: "rgba(124, 58, 237, 0.15)",
    textPrimary: "#2e1065",
    textSecondary: "#4c1d95",
    textTertiary: "#5b21b6",
    textDisabled: "#c4b5fd",
  },
  dark: {
    background: "#0f0520",
    backgroundAlt: "#2e1065",
    surface: "rgba(46, 16, 101, 0.9)",
    surfaceAlt: "rgba(76, 29, 149, 0.6)",
    onBackground: "#f3e8ff",
    onSurface: "#e9d5ff",
    divider: "rgba(167, 139, 250, 0.12)",
    border: "rgba(167, 139, 250, 0.18)",
    textPrimary: "#f3e8ff",
    textSecondary: "#c4b5fd",
    textTertiary: "#a78bfa",
    textDisabled: "#8b5cf6",
  },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SLATE - Minimal Neutrals
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const slatePreset: ColorPreset = {
  id: "slate",
  name: "Slate",
  description: "Clean neutrals with subtle blue undertones",
  colors: {
    primary: "#475569", // Slate 600
    secondary: "#64748b", // Slate 500
    tertiary: "#94a3b8", // Slate 400
  },
  palette: {
    primary: "#475569",
    primaryLight: "#64748b",
    primaryDark: "#334155",
    onPrimary: "#ffffff",
    secondary: "#64748b",
    secondaryLight: "#94a3b8",
    secondaryDark: "#475569",
    onSecondary: "#ffffff",
    tertiary: "#94a3b8",
    onTertiary: "#0f172a",
    info: "#0ea5e9",
    success: "#22c55e",
    warning: "#eab308",
    error: "#ef4444",
  },
  light: {
    background: "#f8fafc",
    backgroundAlt: "#f1f5f9",
    surface: "#ffffff",
    surfaceAlt: "#f8fafc",
    onBackground: "#0f172a",
    onSurface: "#1e293b",
    divider: "rgba(71, 85, 105, 0.1)",
    border: "rgba(71, 85, 105, 0.15)",
    textPrimary: "#0f172a",
    textSecondary: "#334155",
    textTertiary: "#475569",
    textDisabled: "#94a3b8",
  },
  dark: {
    background: "#020617",
    backgroundAlt: "#0f172a",
    surface: "rgba(15, 23, 42, 0.95)",
    surfaceAlt: "rgba(30, 41, 59, 0.8)",
    onBackground: "#f1f5f9",
    onSurface: "#e2e8f0",
    divider: "rgba(148, 163, 184, 0.1)",
    border: "rgba(148, 163, 184, 0.15)",
    textPrimary: "#f1f5f9",
    textSecondary: "#cbd5e1",
    textTertiary: "#94a3b8",
    textDisabled: "#64748b",
  },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MINT - Fresh Greens
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const mintPreset: ColorPreset = {
  id: "mint",
  name: "Mint",
  description: "Fresh minty greens and teals",
  colors: {
    primary: "#10b981", // Emerald 500
    secondary: "#14b8a6", // Teal 500
    tertiary: "#34d399", // Emerald 400
  },
  palette: {
    primary: "#10b981",
    primaryLight: "#34d399",
    primaryDark: "#059669",
    onPrimary: "#ffffff",
    secondary: "#14b8a6",
    secondaryLight: "#2dd4bf",
    secondaryDark: "#0d9488",
    onSecondary: "#ffffff",
    tertiary: "#34d399",
    onTertiary: "#022c22",
    info: "#0ea5e9",
    success: "#22c55e",
    warning: "#eab308",
    error: "#ef4444",
  },
  light: {
    background: "#ecfdf5",
    backgroundAlt: "#d1fae5",
    surface: "#ffffff",
    surfaceAlt: "#ecfdf5",
    onBackground: "#022c22",
    onSurface: "#064e3b",
    divider: "rgba(16, 185, 129, 0.1)",
    border: "rgba(16, 185, 129, 0.15)",
    textPrimary: "#022c22",
    textSecondary: "#064e3b",
    textTertiary: "#047857",
    textDisabled: "#6ee7b7",
  },
  dark: {
    background: "#011612",
    backgroundAlt: "#022c22",
    surface: "rgba(6, 78, 59, 0.9)",
    surfaceAlt: "rgba(4, 120, 87, 0.6)",
    onBackground: "#d1fae5",
    onSurface: "#a7f3d0",
    divider: "rgba(52, 211, 153, 0.12)",
    border: "rgba(52, 211, 153, 0.18)",
    textPrimary: "#d1fae5",
    textSecondary: "#6ee7b7",
    textTertiary: "#34d399",
    textDisabled: "#10b981",
  },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EXPORTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** All color presets as an array */
export const allColorPresets: ColorPreset[] = [
  defaultPreset,
  oceanPreset,
  forestPreset,
  sunsetPreset,
  rosePreset,
  lavenderPreset,
  slatePreset,
  mintPreset,
];

/** Color presets indexed by ID */
export const colorPresetsById: ColorPresetCollection = {
  default: defaultPreset,
  ocean: oceanPreset,
  forest: forestPreset,
  sunset: sunsetPreset,
  rose: rosePreset,
  lavender: lavenderPreset,
  slate: slatePreset,
  mint: mintPreset,
};

/** Get a color preset by ID */
export function getColorPreset(id: ColorPresetId): ColorPreset {
  return colorPresetsById[id];
}

/** Check if a string is a valid color preset ID */
export function isValidColorPreset(id: string): id is ColorPresetId {
  return id in colorPresetsById;
}
