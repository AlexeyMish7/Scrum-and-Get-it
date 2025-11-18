/**
 * Theme Preset Definitions
 *
 * Collection of pre-configured theme presets for quick theme switching.
 * Each preset overrides base tokens to create a distinct visual style.
 */

import type { ThemePreset, PresetCollection } from "./types";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PROFESSIONAL PRESETS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const professionalLight: ThemePreset = {
  meta: {
    id: "professional-light",
    name: "Professional Light",
    description:
      "Clean, corporate aesthetic with muted colors and sharp corners",
    category: "professional",
    mode: "light",
    tags: ["corporate", "clean", "minimal"],
  },
  tokens: {
    palette: {
      primary: "#2C3E50",
      onPrimary: "#FFFFFF",
      secondary: "#E67E22",
      onSecondary: "#FFFFFF",
      tertiary: "#3498DB",
      onTertiary: "#FFFFFF",
      background: "#FFFFFF",
      onBackground: "#2C3E50",
      surface: "#F8F9FA",
      onSurface: "#2C3E50",
      error: "#E74C3C",
      onError: "#FFFFFF",
      warning: "#F39C12",
      onWarning: "#FFFFFF",
      success: "#27AE60",
      onSuccess: "#FFFFFF",
      divider: "rgba(44, 62, 80, 0.12)",
    },
    effects: {
      borderRadius: {
        sm: 4,
        md: 4,
        lg: 4,
      },
      elevation: {
        level1: "0 1px 3px rgba(0,0,0,0.08)",
        level2: "0 2px 6px rgba(0,0,0,0.10)",
        level3: "0 4px 12px rgba(0,0,0,0.12)",
      },
      depth: "subtle",
    },
  },
};

export const professionalDark: ThemePreset = {
  meta: {
    id: "professional-dark",
    name: "Professional Dark",
    description: "Dark corporate theme with muted colors and professional feel",
    category: "professional",
    mode: "dark",
    tags: ["corporate", "dark", "minimal"],
  },
  tokens: {
    palette: {
      primary: "#5DADE2",
      onPrimary: "#FFFFFF",
      secondary: "#F39C12",
      onSecondary: "#FFFFFF",
      tertiary: "#85C1E9",
      onTertiary: "#000000",
      background: "#1C2833",
      onBackground: "#ECF0F1",
      surface: "#2C3E50",
      onSurface: "#ECF0F1",
      error: "#E74C3C",
      onError: "#FFFFFF",
      warning: "#F8C471",
      onWarning: "#000000",
      success: "#58D68D",
      onSuccess: "#FFFFFF",
      divider: "rgba(189, 195, 199, 0.12)",
    },
    effects: {
      borderRadius: {
        sm: 4,
        md: 4,
        lg: 4,
      },
      elevation: {
        level1: "0 1px 3px rgba(0,0,0,0.3)",
        level2: "0 2px 6px rgba(0,0,0,0.4)",
        level3: "0 4px 12px rgba(0,0,0,0.5)",
      },
      depth: "subtle",
    },
  },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CREATIVE PRESETS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const creativeLight: ThemePreset = {
  meta: {
    id: "creative-light",
    name: "Creative Light",
    description: "Vibrant colors with rounded corners and subtle glow effects",
    category: "creative",
    mode: "light",
    tags: ["vibrant", "modern", "startup"],
  },
  tokens: {
    palette: {
      primary: "#8E44AD",
      onPrimary: "#FFFFFF",
      secondary: "#1ABC9C",
      onSecondary: "#FFFFFF",
      tertiary: "#9B59B6",
      onTertiary: "#FFFFFF",
      background: "#FAFAFA",
      onBackground: "#2C3E50",
      surface: "#FFFFFF",
      onSurface: "#2C3E50",
      error: "#E74C3C",
      onError: "#FFFFFF",
      warning: "#F39C12",
      onWarning: "#FFFFFF",
      success: "#27AE60",
      onSuccess: "#FFFFFF",
      divider: "rgba(127, 140, 141, 0.12)",
    },
    effects: {
      borderRadius: {
        sm: 8,
        md: 12,
        lg: 16,
      },
      elevation: {
        level1: "0 2px 8px rgba(142,68,173,0.1)",
        level2: "0 4px 12px rgba(142,68,173,0.15)",
        level3: "0 8px 24px rgba(142,68,173,0.2)",
      },
      depth: "normal",
      glow: {
        color: "rgba(142, 68, 173, 0.3)",
        spread: "0 0 16px",
        strength: 1.2,
        appliesTo: {
          button: true,
          card: false,
          inputFocus: true,
        },
      },
    },
    motion: {
      duration: {
        short: 150,
        medium: 250,
        long: 400,
      },
    },
  },
};

export const creativeDark: ThemePreset = {
  meta: {
    id: "creative-dark",
    name: "Creative Dark",
    description: "Dark theme with vibrant accent colors and glow effects",
    category: "creative",
    mode: "dark",
    tags: ["vibrant", "dark", "modern"],
  },
  tokens: {
    palette: {
      primary: "#9B59B6",
      onPrimary: "#FFFFFF",
      secondary: "#48C9B0",
      onSecondary: "#FFFFFF",
      tertiary: "#BB8FCE",
      onTertiary: "#000000",
      background: "#1A1A2E",
      onBackground: "#EAECEE",
      surface: "#16213E",
      onSurface: "#EAECEE",
      error: "#E74C3C",
      onError: "#FFFFFF",
      warning: "#F8C471",
      onWarning: "#000000",
      success: "#58D68D",
      onSuccess: "#FFFFFF",
      divider: "rgba(174, 182, 191, 0.12)",
    },
    effects: {
      borderRadius: {
        sm: 8,
        md: 12,
        lg: 16,
      },
      elevation: {
        level1: "0 2px 8px rgba(155,89,182,0.2)",
        level2: "0 4px 12px rgba(155,89,182,0.3)",
        level3: "0 8px 24px rgba(155,89,182,0.4)",
      },
      depth: "normal",
      glow: {
        color: "rgba(155, 89, 182, 0.5)",
        spread: "0 0 20px",
        strength: 1.5,
        appliesTo: {
          button: true,
          card: true,
          inputFocus: true,
        },
      },
    },
    motion: {
      duration: {
        short: 150,
        medium: 250,
        long: 400,
      },
    },
  },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ACCESSIBLE PRESETS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const accessibleLight: ThemePreset = {
  meta: {
    id: "accessible-light",
    name: "Accessible Light",
    description:
      "High contrast with WCAG AAA compliance and enhanced focus indicators",
    category: "accessible",
    mode: "light",
    tags: ["accessible", "high-contrast", "a11y"],
  },
  tokens: {
    palette: {
      primary: "#000000",
      onPrimary: "#FFFFFF",
      secondary: "#CC8E00",
      onSecondary: "#000000",
      tertiary: "#333333",
      onTertiary: "#FFFFFF",
      background: "#FFFFFF",
      onBackground: "#000000",
      surface: "#FFFFFF",
      onSurface: "#000000",
      error: "#CC0000",
      onError: "#FFFFFF",
      warning: "#CC8E00",
      onWarning: "#000000",
      success: "#007700",
      onSuccess: "#FFFFFF",
      divider: "rgba(0, 0, 0, 0.3)",
    },
    effects: {
      borderRadius: {
        sm: 4,
        md: 4,
        lg: 4,
      },
      focusRing: {
        color: "#CC8E00",
        width: 3, // Thick focus ring
        offset: 2,
        style: "solid",
      },
      elevation: {
        level1: "0 0 0 1px rgba(0,0,0,0.1)",
        level2: "0 0 0 2px rgba(0,0,0,0.15)",
        level3: "0 0 0 3px rgba(0,0,0,0.2)",
      },
      depth: "flat", // Minimal shadows for clarity
    },
    motion: {
      duration: {
        short: 100, // Faster for reduced motion preference
        medium: 200,
        long: 300,
      },
    },
  },
};

export const accessibleDark: ThemePreset = {
  meta: {
    id: "accessible-dark",
    name: "Accessible Dark",
    description:
      "High contrast dark theme with enhanced accessibility features",
    category: "accessible",
    mode: "dark",
    tags: ["accessible", "dark", "high-contrast"],
  },
  tokens: {
    palette: {
      primary: "#FFFFFF",
      onPrimary: "#000000",
      secondary: "#FFD700",
      onSecondary: "#000000",
      tertiary: "#E0E0E0",
      onTertiary: "#000000",
      background: "#000000",
      onBackground: "#FFFFFF",
      surface: "#1A1A1A",
      onSurface: "#FFFFFF",
      error: "#FF4444",
      onError: "#000000",
      warning: "#FFD700",
      onWarning: "#000000",
      success: "#00DD00",
      onSuccess: "#000000",
      divider: "rgba(255, 255, 255, 0.3)",
    },
    effects: {
      borderRadius: {
        sm: 4,
        md: 4,
        lg: 4,
      },
      focusRing: {
        color: "#FFD700",
        width: 3,
        offset: 2,
        style: "solid",
      },
      elevation: {
        level1: "0 0 0 1px rgba(255,255,255,0.2)",
        level2: "0 0 0 2px rgba(255,255,255,0.3)",
        level3: "0 0 0 3px rgba(255,255,255,0.4)",
      },
      depth: "flat",
    },
    motion: {
      duration: {
        short: 100,
        medium: 200,
        long: 300,
      },
    },
  },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MINIMAL PRESETS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const minimalLight: ThemePreset = {
  meta: {
    id: "minimal-light",
    name: "Minimal Light",
    description: "Ultra-minimal design with subtle grays and flat aesthetic",
    category: "minimal",
    mode: "light",
    tags: ["minimal", "clean", "flat"],
  },
  tokens: {
    palette: {
      primary: "#424242",
      onPrimary: "#FFFFFF",
      secondary: "#757575",
      onSecondary: "#FFFFFF",
      tertiary: "#616161",
      onTertiary: "#FFFFFF",
      background: "#FAFAFA",
      onBackground: "#212121",
      surface: "#FFFFFF",
      onSurface: "#212121",
      error: "#D32F2F",
      onError: "#FFFFFF",
      warning: "#F57C00",
      onWarning: "#FFFFFF",
      success: "#388E3C",
      onSuccess: "#FFFFFF",
      divider: "rgba(0, 0, 0, 0.08)",
    },
    effects: {
      borderRadius: {
        sm: 2,
        md: 2,
        lg: 2,
      },
      elevation: {
        level1: "0 0 0 1px rgba(0,0,0,0.05)",
        level2: "0 0 0 1px rgba(0,0,0,0.08)",
        level3: "0 0 0 1px rgba(0,0,0,0.12)",
      },
      depth: "flat",
    },
    motion: {
      duration: {
        short: 100,
        medium: 180,
        long: 250,
      },
    },
  },
};

export const minimalDark: ThemePreset = {
  meta: {
    id: "minimal-dark",
    name: "Minimal Dark",
    description: "Dark minimal theme with flat design and subtle contrasts",
    category: "minimal",
    mode: "dark",
    tags: ["minimal", "dark", "flat"],
  },
  tokens: {
    palette: {
      primary: "#BDBDBD",
      onPrimary: "#000000",
      secondary: "#9E9E9E",
      onSecondary: "#000000",
      tertiary: "#E0E0E0",
      onTertiary: "#000000",
      background: "#121212",
      onBackground: "#E0E0E0",
      surface: "#1E1E1E",
      onSurface: "#E0E0E0",
      error: "#EF5350",
      onError: "#000000",
      warning: "#FF9800",
      onWarning: "#000000",
      success: "#66BB6A",
      onSuccess: "#000000",
      divider: "rgba(255, 255, 255, 0.08)",
    },
    effects: {
      borderRadius: {
        sm: 2,
        md: 2,
        lg: 2,
      },
      elevation: {
        level1: "0 0 0 1px rgba(255,255,255,0.05)",
        level2: "0 0 0 1px rgba(255,255,255,0.08)",
        level3: "0 0 0 1px rgba(255,255,255,0.12)",
      },
      depth: "flat",
    },
    motion: {
      duration: {
        short: 100,
        medium: 180,
        long: 250,
      },
    },
  },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PRESET COLLECTIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * All available theme presets
 */
export const allPresets: ThemePreset[] = [
  professionalLight,
  professionalDark,
  creativeLight,
  creativeDark,
  accessibleLight,
  accessibleDark,
  minimalLight,
  minimalDark,
];

/**
 * Presets organized by category and mode
 */
export const presetsByCategory: PresetCollection = {
  professional: {
    light: professionalLight,
    dark: professionalDark,
  },
  creative: {
    light: creativeLight,
    dark: creativeDark,
  },
  accessible: {
    light: accessibleLight,
    dark: accessibleDark,
  },
  minimal: {
    light: minimalLight,
    dark: minimalDark,
  },
};

/**
 * Presets indexed by ID for quick lookup
 */
export const presetsById = {
  "professional-light": professionalLight,
  "professional-dark": professionalDark,
  "creative-light": creativeLight,
  "creative-dark": creativeDark,
  "accessible-light": accessibleLight,
  "accessible-dark": accessibleDark,
  "minimal-light": minimalLight,
  "minimal-dark": minimalDark,
} as const;
