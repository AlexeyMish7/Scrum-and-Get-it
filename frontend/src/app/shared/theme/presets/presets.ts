/**
 * Theme Preset Definitions v2.0
 *
 * Collection of pre-configured theme presets for quick theme switching.
 * Each preset creates a distinct visual identity with cohesive colors.
 *
 * Updated for Design System v2.0:
 * - More vibrant and distinct color palettes
 * - Consistent border radius across presets
 * - Enhanced glow and shadow effects
 * - Better light/dark mode parity
 */

import type { ThemePreset, PresetCollection } from "./types";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PROFESSIONAL PRESETS - Slate Blue Business Aesthetic
// Clean, trustworthy colors for professional applications
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const professionalLight: ThemePreset = {
  meta: {
    id: "professional-light",
    name: "Professional Light",
    description: "Clean business aesthetic with slate blue and warm accents",
    category: "professional",
    mode: "light",
    tags: ["corporate", "clean", "trustworthy"],
  },
  tokens: {
    palette: {
      primary: "#1e40af",
      onPrimary: "#FFFFFF",
      primaryLight: "#3b82f6",
      primaryDark: "#1e3a8a",
      secondary: "#ea580c",
      onSecondary: "#FFFFFF",
      secondaryLight: "#fb923c",
      secondaryDark: "#c2410c",
      tertiary: "#0891b2",
      onTertiary: "#FFFFFF",
      info: "#0284c7",
      onInfo: "#FFFFFF",
      background: "#f8fafc",
      onBackground: "#1e293b",
      backgroundAlt: "#f1f5f9",
      surface: "#ffffff",
      onSurface: "#334155",
      surfaceAlt: "#f8fafc",
      error: "#dc2626",
      onError: "#FFFFFF",
      errorLight: "#fee2e2",
      warning: "#d97706",
      onWarning: "#FFFFFF",
      warningLight: "#fef3c7",
      success: "#059669",
      onSuccess: "#FFFFFF",
      successLight: "#d1fae5",
      divider: "rgba(30, 64, 175, 0.08)",
      border: "rgba(30, 64, 175, 0.12)",
      text: {
        primary: "#1e293b",
        secondary: "#475569",
        tertiary: "#64748b",
        disabled: "#94a3b8",
        inverse: "#FFFFFF",
        link: "#1e40af",
        linkHover: "#1e3a8a",
      },
      gradientPrimary: "linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)",
      gradientSecondary: "linear-gradient(135deg, #ea580c 0%, #c2410c 100%)",
    },
    effects: {
      borderRadius: {
        none: 0,
        sm: 6,
        md: 8,
        lg: 12,
        xl: 16,
        full: 9999,
      },
      elevation: {
        none: "none",
        level1:
          "0 1px 2px rgba(30, 64, 175, 0.04), 0 1px 3px rgba(0, 0, 0, 0.06)",
        level2:
          "0 2px 4px rgba(30, 64, 175, 0.06), 0 4px 8px rgba(0, 0, 0, 0.08)",
        level3:
          "0 4px 8px rgba(30, 64, 175, 0.08), 0 8px 16px rgba(0, 0, 0, 0.10)",
        level4:
          "0 8px 16px rgba(30, 64, 175, 0.10), 0 16px 32px rgba(0, 0, 0, 0.12)",
        level5:
          "0 16px 32px rgba(30, 64, 175, 0.12), 0 24px 48px rgba(0, 0, 0, 0.14)",
      },
      depth: "subtle",
      focusRing: {
        color: "rgba(30, 64, 175, 0.35)",
        width: 3,
        offset: 2,
        style: "solid",
      },
      glow: {
        color: "rgba(30, 64, 175, 0.15)",
        spread: "0 0 12px",
        strength: 0.8,
        appliesTo: {
          button: true,
          card: false,
          paper: false,
          inputFocus: true,
          link: false,
        },
      },
    },
    components: {
      button: {
        borderRadius: 8,
        fontWeight: 600,
        letterSpacing: "0.01em",
        textTransform: "none",
      },
      card: {
        borderRadius: 12,
        shadow:
          "0 1px 3px rgba(30, 64, 175, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)",
        hoverShadow:
          "0 4px 12px rgba(30, 64, 175, 0.1), 0 2px 6px rgba(0, 0, 0, 0.06)",
      },
    },
  },
};

export const professionalDark: ThemePreset = {
  meta: {
    id: "professional-dark",
    name: "Professional Dark",
    description: "Sophisticated dark theme with blue accents",
    category: "professional",
    mode: "dark",
    tags: ["corporate", "dark", "sophisticated"],
  },
  tokens: {
    palette: {
      primary: "#60a5fa",
      onPrimary: "#1e3a8a",
      primaryLight: "#93c5fd",
      primaryDark: "#3b82f6",
      secondary: "#fb923c",
      onSecondary: "#7c2d12",
      secondaryLight: "#fdba74",
      secondaryDark: "#ea580c",
      tertiary: "#22d3ee",
      onTertiary: "#083344",
      info: "#38bdf8",
      onInfo: "#0c4a6e",
      background: "#0f172a",
      onBackground: "#f1f5f9",
      backgroundAlt: "#1e293b",
      surface: "rgba(30, 41, 59, 0.95)",
      onSurface: "#e2e8f0",
      surfaceAlt: "rgba(51, 65, 85, 0.8)",
      error: "#f87171",
      onError: "#7f1d1d",
      errorLight: "rgba(248, 113, 113, 0.15)",
      warning: "#fbbf24",
      onWarning: "#78350f",
      warningLight: "rgba(251, 191, 36, 0.15)",
      success: "#34d399",
      onSuccess: "#064e3b",
      successLight: "rgba(52, 211, 153, 0.15)",
      divider: "rgba(96, 165, 250, 0.1)",
      border: "rgba(96, 165, 250, 0.12)",
      text: {
        primary: "#f1f5f9",
        secondary: "#94a3b8",
        tertiary: "#64748b",
        disabled: "#475569",
        inverse: "#0f172a",
        link: "#60a5fa",
        linkHover: "#93c5fd",
      },
      gradientPrimary: "linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)",
      gradientSecondary: "linear-gradient(135deg, #fb923c 0%, #ea580c 100%)",
    },
    effects: {
      borderRadius: {
        none: 0,
        sm: 6,
        md: 8,
        lg: 12,
        xl: 16,
        full: 9999,
      },
      elevation: {
        none: "none",
        level1: "0 1px 2px rgba(0, 0, 0, 0.25), 0 1px 4px rgba(0, 0, 0, 0.15)",
        level2: "0 2px 6px rgba(0, 0, 0, 0.3), 0 4px 12px rgba(0, 0, 0, 0.2)",
        level3:
          "0 4px 12px rgba(0, 0, 0, 0.35), 0 8px 24px rgba(0, 0, 0, 0.25)",
        level4: "0 8px 20px rgba(0, 0, 0, 0.4), 0 16px 40px rgba(0, 0, 0, 0.3)",
        level5:
          "0 16px 32px rgba(0, 0, 0, 0.45), 0 24px 56px rgba(0, 0, 0, 0.35)",
      },
      depth: "subtle",
      focusRing: {
        color: "rgba(96, 165, 250, 0.4)",
        width: 3,
        offset: 2,
        style: "solid",
      },
      glow: {
        color: "rgba(96, 165, 250, 0.25)",
        spread: "0 0 16px",
        strength: 1,
        appliesTo: {
          button: true,
          card: false,
          paper: false,
          inputFocus: true,
          link: false,
        },
      },
    },
    components: {
      button: {
        borderRadius: 8,
        fontWeight: 600,
        letterSpacing: "0.01em",
        textTransform: "none",
      },
      card: {
        borderRadius: 12,
        shadow: "0 2px 6px rgba(0, 0, 0, 0.25), 0 4px 12px rgba(0, 0, 0, 0.15)",
        hoverShadow:
          "0 4px 16px rgba(96, 165, 250, 0.1), 0 8px 24px rgba(0, 0, 0, 0.25)",
      },
    },
  },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CREATIVE PRESETS - Violet & Teal Energy
// Bold, vibrant colors for creative and startup apps
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const creativeLight: ThemePreset = {
  meta: {
    id: "creative-light",
    name: "Creative Light",
    description: "Vibrant violet and teal with playful glow effects",
    category: "creative",
    mode: "light",
    tags: ["vibrant", "modern", "startup"],
  },
  tokens: {
    palette: {
      primary: "#7c3aed",
      onPrimary: "#FFFFFF",
      primaryLight: "#a78bfa",
      primaryDark: "#5b21b6",
      secondary: "#14b8a6",
      onSecondary: "#FFFFFF",
      secondaryLight: "#2dd4bf",
      secondaryDark: "#0d9488",
      tertiary: "#ec4899",
      onTertiary: "#FFFFFF",
      info: "#06b6d4",
      onInfo: "#FFFFFF",
      background: "#faf5ff",
      onBackground: "#1e1b4b",
      backgroundAlt: "#f3e8ff",
      surface: "#ffffff",
      onSurface: "#3730a3",
      surfaceAlt: "#faf5ff",
      error: "#e11d48",
      onError: "#FFFFFF",
      errorLight: "#ffe4e6",
      warning: "#f59e0b",
      onWarning: "#FFFFFF",
      warningLight: "#fef3c7",
      success: "#10b981",
      onSuccess: "#FFFFFF",
      successLight: "#d1fae5",
      divider: "rgba(124, 58, 237, 0.1)",
      border: "rgba(124, 58, 237, 0.15)",
      text: {
        primary: "#1e1b4b",
        secondary: "#4c1d95",
        tertiary: "#6d28d9",
        disabled: "#a78bfa",
        inverse: "#FFFFFF",
        link: "#7c3aed",
        linkHover: "#5b21b6",
      },
      gradientPrimary: "linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)",
      gradientSecondary: "linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)",
      gradientAccent:
        "linear-gradient(135deg, #7c3aed 0%, #ec4899 50%, #14b8a6 100%)",
    },
    effects: {
      borderRadius: {
        none: 0,
        sm: 8,
        md: 12,
        lg: 16,
        xl: 24,
        full: 9999,
      },
      elevation: {
        none: "none",
        level1:
          "0 2px 8px rgba(124, 58, 237, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04)",
        level2:
          "0 4px 16px rgba(124, 58, 237, 0.12), 0 2px 6px rgba(0, 0, 0, 0.06)",
        level3:
          "0 8px 24px rgba(124, 58, 237, 0.16), 0 4px 12px rgba(0, 0, 0, 0.08)",
        level4:
          "0 12px 32px rgba(124, 58, 237, 0.18), 0 6px 16px rgba(0, 0, 0, 0.10)",
        level5:
          "0 20px 48px rgba(124, 58, 237, 0.22), 0 10px 24px rgba(0, 0, 0, 0.12)",
      },
      depth: "normal",
      focusRing: {
        color: "rgba(124, 58, 237, 0.4)",
        width: 3,
        offset: 2,
        style: "solid",
      },
      glow: {
        color: "rgba(124, 58, 237, 0.35)",
        spread: "0 0 20px",
        strength: 1.2,
        appliesTo: {
          button: true,
          card: false,
          paper: false,
          inputFocus: true,
          link: true,
        },
      },
    },
    motion: {
      duration: {
        instant: 0,
        fast: 100,
        short: 150,
        medium: 200,
        long: 350,
        slower: 500,
      },
      easing: {
        standard: "cubic-bezier(0.4, 0, 0.2, 1)",
        emphasized: "cubic-bezier(0.2, 0.8, 0.2, 1)",
        decelerate: "cubic-bezier(0.0, 0, 0.2, 1)",
        accelerate: "cubic-bezier(0.4, 0, 1, 1)",
        linear: "linear",
        bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
      },
    },
    interaction: {
      hoverOpacity: 0.06,
      activeOpacity: 0.12,
      disabledOpacity: 0.4,
      hoverGlow: true,
      activeGlow: true,
      pressTransform: "scale(0.98)",
      hoverScale: "scale(1.02)",
      transitionDuration: 150,
    },
    components: {
      button: {
        borderRadius: 12,
        fontWeight: 600,
        letterSpacing: "0.01em",
        textTransform: "none",
      },
      card: {
        borderRadius: 16,
        shadow:
          "0 4px 16px rgba(124, 58, 237, 0.1), 0 2px 6px rgba(0, 0, 0, 0.04)",
        hoverShadow:
          "0 8px 28px rgba(124, 58, 237, 0.18), 0 4px 12px rgba(0, 0, 0, 0.06)",
      },
      chip: {
        borderRadius: 9999,
      },
    },
  },
};

export const creativeDark: ThemePreset = {
  meta: {
    id: "creative-dark",
    name: "Creative Dark",
    description: "Dark theme with neon violet and teal accents",
    category: "creative",
    mode: "dark",
    tags: ["vibrant", "dark", "neon"],
  },
  tokens: {
    palette: {
      primary: "#a78bfa",
      onPrimary: "#1e1b4b",
      primaryLight: "#c4b5fd",
      primaryDark: "#8b5cf6",
      secondary: "#2dd4bf",
      onSecondary: "#042f2e",
      secondaryLight: "#5eead4",
      secondaryDark: "#14b8a6",
      tertiary: "#f472b6",
      onTertiary: "#500724",
      info: "#22d3ee",
      onInfo: "#083344",
      background: "#0c0a1d",
      onBackground: "#ede9fe",
      backgroundAlt: "#1e1b4b",
      surface: "rgba(30, 27, 75, 0.95)",
      onSurface: "#e9d5ff",
      surfaceAlt: "rgba(76, 29, 149, 0.4)",
      error: "#fb7185",
      onError: "#4c0519",
      errorLight: "rgba(251, 113, 133, 0.15)",
      warning: "#fbbf24",
      onWarning: "#78350f",
      warningLight: "rgba(251, 191, 36, 0.15)",
      success: "#34d399",
      onSuccess: "#064e3b",
      successLight: "rgba(52, 211, 153, 0.15)",
      divider: "rgba(167, 139, 250, 0.12)",
      border: "rgba(167, 139, 250, 0.15)",
      text: {
        primary: "#ede9fe",
        secondary: "#c4b5fd",
        tertiary: "#a78bfa",
        disabled: "#6d28d9",
        inverse: "#0c0a1d",
        link: "#a78bfa",
        linkHover: "#c4b5fd",
      },
      gradientPrimary: "linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)",
      gradientSecondary: "linear-gradient(135deg, #2dd4bf 0%, #14b8a6 100%)",
      gradientAccent:
        "linear-gradient(135deg, #a78bfa 0%, #f472b6 50%, #2dd4bf 100%)",
    },
    effects: {
      borderRadius: {
        none: 0,
        sm: 8,
        md: 12,
        lg: 16,
        xl: 24,
        full: 9999,
      },
      elevation: {
        none: "none",
        level1:
          "0 2px 8px rgba(167, 139, 250, 0.15), 0 1px 4px rgba(0, 0, 0, 0.2)",
        level2:
          "0 4px 16px rgba(167, 139, 250, 0.2), 0 2px 8px rgba(0, 0, 0, 0.25)",
        level3:
          "0 8px 28px rgba(167, 139, 250, 0.25), 0 4px 12px rgba(0, 0, 0, 0.3)",
        level4:
          "0 12px 36px rgba(167, 139, 250, 0.3), 0 6px 16px rgba(0, 0, 0, 0.35)",
        level5:
          "0 20px 50px rgba(167, 139, 250, 0.35), 0 10px 24px rgba(0, 0, 0, 0.4)",
      },
      depth: "normal",
      focusRing: {
        color: "rgba(167, 139, 250, 0.5)",
        width: 3,
        offset: 2,
        style: "solid",
      },
      glow: {
        color: "rgba(167, 139, 250, 0.5)",
        spread: "0 0 24px",
        strength: 1.5,
        appliesTo: {
          button: true,
          card: true,
          paper: false,
          inputFocus: true,
          link: true,
        },
      },
      glass: {
        blur: 24,
        opacity: 0.8,
        saturation: 1.5,
      },
    },
    motion: {
      duration: {
        instant: 0,
        fast: 100,
        short: 150,
        medium: 200,
        long: 350,
        slower: 500,
      },
      easing: {
        standard: "cubic-bezier(0.4, 0, 0.2, 1)",
        emphasized: "cubic-bezier(0.2, 0.8, 0.2, 1)",
        decelerate: "cubic-bezier(0.0, 0, 0.2, 1)",
        accelerate: "cubic-bezier(0.4, 0, 1, 1)",
        linear: "linear",
        bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
      },
    },
    interaction: {
      hoverOpacity: 0.08,
      activeOpacity: 0.15,
      disabledOpacity: 0.4,
      hoverGlow: true,
      activeGlow: true,
      pressTransform: "scale(0.98)",
      hoverScale: "scale(1.02)",
      transitionDuration: 150,
    },
    components: {
      button: {
        borderRadius: 12,
        fontWeight: 600,
        letterSpacing: "0.01em",
        textTransform: "none",
      },
      card: {
        borderRadius: 16,
        shadow:
          "0 4px 20px rgba(167, 139, 250, 0.2), 0 2px 8px rgba(0, 0, 0, 0.25)",
        hoverShadow:
          "0 8px 32px rgba(167, 139, 250, 0.35), 0 4px 16px rgba(0, 0, 0, 0.3)",
      },
      chip: {
        borderRadius: 9999,
      },
    },
  },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ACCESSIBLE PRESETS - High Contrast Clarity
// WCAG AAA compliant with enhanced focus indicators
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const accessibleLight: ThemePreset = {
  meta: {
    id: "accessible-light",
    name: "Accessible Light",
    description:
      "High contrast with WCAG AAA compliance and bold focus indicators",
    category: "accessible",
    mode: "light",
    tags: ["accessible", "high-contrast", "a11y"],
  },
  tokens: {
    palette: {
      primary: "#0f172a",
      onPrimary: "#FFFFFF",
      primaryLight: "#334155",
      primaryDark: "#020617",
      secondary: "#b45309",
      onSecondary: "#FFFFFF",
      secondaryLight: "#d97706",
      secondaryDark: "#92400e",
      tertiary: "#1e40af",
      onTertiary: "#FFFFFF",
      info: "#0369a1",
      onInfo: "#FFFFFF",
      background: "#ffffff",
      onBackground: "#0f172a",
      backgroundAlt: "#f1f5f9",
      surface: "#ffffff",
      onSurface: "#0f172a",
      surfaceAlt: "#f8fafc",
      error: "#b91c1c",
      onError: "#FFFFFF",
      errorLight: "#fee2e2",
      warning: "#a16207",
      onWarning: "#FFFFFF",
      warningLight: "#fef3c7",
      success: "#15803d",
      onSuccess: "#FFFFFF",
      successLight: "#dcfce7",
      divider: "rgba(15, 23, 42, 0.2)",
      border: "rgba(15, 23, 42, 0.3)",
      text: {
        primary: "#0f172a",
        secondary: "#1e293b",
        tertiary: "#334155",
        disabled: "#64748b",
        inverse: "#FFFFFF",
        link: "#1d4ed8",
        linkHover: "#1e40af",
      },
    },
    effects: {
      borderRadius: {
        none: 0,
        sm: 4,
        md: 6,
        lg: 8,
        xl: 12,
        full: 9999,
      },
      focusRing: {
        color: "#b45309",
        width: 4,
        offset: 2,
        style: "solid",
      },
      elevation: {
        none: "none",
        level1: "0 0 0 1px rgba(15, 23, 42, 0.15)",
        level2: "0 0 0 2px rgba(15, 23, 42, 0.15)",
        level3: "0 0 0 3px rgba(15, 23, 42, 0.15)",
        level4: "0 0 0 4px rgba(15, 23, 42, 0.15)",
        level5: "0 0 0 5px rgba(15, 23, 42, 0.15)",
      },
      depth: "flat",
      border: {
        width: {
          none: 0,
          thin: 2,
          medium: 3,
          thick: 4,
        },
        style: {
          solid: "solid",
          dashed: "dashed",
          dotted: "dotted",
        },
      },
      glow: {
        color: "rgba(180, 83, 9, 0.4)",
        spread: "0 0 0 4px",
        strength: 1,
        appliesTo: {
          button: false,
          card: false,
          paper: false,
          inputFocus: true,
          link: false,
        },
      },
    },
    motion: {
      duration: {
        instant: 0,
        fast: 50,
        short: 100,
        medium: 150,
        long: 250,
        slower: 350,
      },
      easing: {
        standard: "cubic-bezier(0.4, 0, 0.2, 1)",
        emphasized: "cubic-bezier(0.4, 0, 0.2, 1)",
        decelerate: "cubic-bezier(0.0, 0, 0.2, 1)",
        accelerate: "cubic-bezier(0.4, 0, 1, 1)",
        linear: "linear",
      },
      reducedMotion: true,
    },
    interaction: {
      hoverOpacity: 0.1,
      activeOpacity: 0.2,
      disabledOpacity: 0.5,
      transitionDuration: 100,
    },
    components: {
      button: {
        borderRadius: 6,
        fontWeight: 700,
        letterSpacing: "0.01em",
        textTransform: "none",
      },
      card: {
        borderRadius: 8,
        border: "rgba(15, 23, 42, 0.2)",
      },
    },
  },
};

export const accessibleDark: ThemePreset = {
  meta: {
    id: "accessible-dark",
    name: "Accessible Dark",
    description:
      "High contrast dark with bright focus indicators for accessibility",
    category: "accessible",
    mode: "dark",
    tags: ["accessible", "dark", "high-contrast"],
  },
  tokens: {
    palette: {
      primary: "#f8fafc",
      onPrimary: "#0f172a",
      primaryLight: "#ffffff",
      primaryDark: "#e2e8f0",
      secondary: "#fbbf24",
      onSecondary: "#0f172a",
      secondaryLight: "#fcd34d",
      secondaryDark: "#f59e0b",
      tertiary: "#93c5fd",
      onTertiary: "#0f172a",
      info: "#7dd3fc",
      onInfo: "#0f172a",
      background: "#020617",
      onBackground: "#f8fafc",
      backgroundAlt: "#0f172a",
      surface: "#1e293b",
      onSurface: "#f8fafc",
      surfaceAlt: "#334155",
      error: "#fca5a5",
      onError: "#0f172a",
      errorLight: "rgba(252, 165, 165, 0.2)",
      warning: "#fcd34d",
      onWarning: "#0f172a",
      warningLight: "rgba(252, 211, 77, 0.2)",
      success: "#86efac",
      onSuccess: "#0f172a",
      successLight: "rgba(134, 239, 172, 0.2)",
      divider: "rgba(248, 250, 252, 0.2)",
      border: "rgba(248, 250, 252, 0.3)",
      text: {
        primary: "#f8fafc",
        secondary: "#e2e8f0",
        tertiary: "#cbd5e1",
        disabled: "#64748b",
        inverse: "#0f172a",
        link: "#93c5fd",
        linkHover: "#bfdbfe",
      },
    },
    effects: {
      borderRadius: {
        none: 0,
        sm: 4,
        md: 6,
        lg: 8,
        xl: 12,
        full: 9999,
      },
      focusRing: {
        color: "#fbbf24",
        width: 4,
        offset: 2,
        style: "solid",
      },
      elevation: {
        none: "none",
        level1: "0 0 0 1px rgba(248, 250, 252, 0.15)",
        level2: "0 0 0 2px rgba(248, 250, 252, 0.15)",
        level3: "0 0 0 3px rgba(248, 250, 252, 0.15)",
        level4: "0 0 0 4px rgba(248, 250, 252, 0.15)",
        level5: "0 0 0 5px rgba(248, 250, 252, 0.15)",
      },
      depth: "flat",
      border: {
        width: {
          none: 0,
          thin: 2,
          medium: 3,
          thick: 4,
        },
        style: {
          solid: "solid",
          dashed: "dashed",
          dotted: "dotted",
        },
      },
      glow: {
        color: "rgba(251, 191, 36, 0.5)",
        spread: "0 0 0 4px",
        strength: 1,
        appliesTo: {
          button: false,
          card: false,
          paper: false,
          inputFocus: true,
          link: false,
        },
      },
    },
    motion: {
      duration: {
        instant: 0,
        fast: 50,
        short: 100,
        medium: 150,
        long: 250,
        slower: 350,
      },
      easing: {
        standard: "cubic-bezier(0.4, 0, 0.2, 1)",
        emphasized: "cubic-bezier(0.4, 0, 0.2, 1)",
        decelerate: "cubic-bezier(0.0, 0, 0.2, 1)",
        accelerate: "cubic-bezier(0.4, 0, 1, 1)",
        linear: "linear",
      },
      reducedMotion: true,
    },
    interaction: {
      hoverOpacity: 0.1,
      activeOpacity: 0.2,
      disabledOpacity: 0.5,
      transitionDuration: 100,
    },
    components: {
      button: {
        borderRadius: 6,
        fontWeight: 700,
        letterSpacing: "0.01em",
        textTransform: "none",
      },
      card: {
        borderRadius: 8,
        border: "rgba(248, 250, 252, 0.2)",
      },
    },
  },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MINIMAL PRESETS - Swiss Design Inspired
// Ultra-clean aesthetic with intentional whitespace
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const minimalLight: ThemePreset = {
  meta: {
    id: "minimal-light",
    name: "Minimal Light",
    description:
      "Swiss-inspired clean design with pure whites and subtle grays",
    category: "minimal",
    mode: "light",
    tags: ["minimal", "clean", "swiss"],
  },
  tokens: {
    palette: {
      primary: "#18181b",
      onPrimary: "#FFFFFF",
      primaryLight: "#3f3f46",
      primaryDark: "#09090b",
      secondary: "#71717a",
      onSecondary: "#FFFFFF",
      secondaryLight: "#a1a1aa",
      secondaryDark: "#52525b",
      tertiary: "#52525b",
      onTertiary: "#FFFFFF",
      info: "#52525b",
      onInfo: "#FFFFFF",
      background: "#ffffff",
      onBackground: "#18181b",
      backgroundAlt: "#fafafa",
      surface: "#ffffff",
      onSurface: "#18181b",
      surfaceAlt: "#f4f4f5",
      error: "#dc2626",
      onError: "#FFFFFF",
      errorLight: "#fef2f2",
      warning: "#d97706",
      onWarning: "#FFFFFF",
      warningLight: "#fffbeb",
      success: "#16a34a",
      onSuccess: "#FFFFFF",
      successLight: "#f0fdf4",
      divider: "rgba(24, 24, 27, 0.06)",
      border: "rgba(24, 24, 27, 0.1)",
      text: {
        primary: "#18181b",
        secondary: "#52525b",
        tertiary: "#71717a",
        disabled: "#a1a1aa",
        inverse: "#fafafa",
        link: "#18181b",
        linkHover: "#3f3f46",
      },
    },
    effects: {
      borderRadius: {
        none: 0,
        sm: 4,
        md: 6,
        lg: 8,
        xl: 10,
        full: 9999,
      },
      elevation: {
        none: "none",
        level1: "0 1px 2px rgba(0, 0, 0, 0.03)",
        level2: "0 2px 4px rgba(0, 0, 0, 0.04)",
        level3: "0 3px 8px rgba(0, 0, 0, 0.05)",
        level4: "0 4px 12px rgba(0, 0, 0, 0.06)",
        level5: "0 6px 16px rgba(0, 0, 0, 0.08)",
      },
      depth: "subtle",
      focusRing: {
        color: "rgba(24, 24, 27, 0.3)",
        width: 2,
        offset: 2,
        style: "solid",
      },
      glow: {
        color: "transparent",
        spread: "0 0 0",
        strength: 0,
        appliesTo: {
          button: false,
          card: false,
          paper: false,
          inputFocus: false,
          link: false,
        },
      },
      border: {
        width: {
          none: 0,
          thin: 1,
          medium: 1,
          thick: 2,
        },
        style: {
          solid: "solid",
          dashed: "dashed",
          dotted: "dotted",
        },
      },
    },
    motion: {
      duration: {
        instant: 0,
        fast: 80,
        short: 120,
        medium: 160,
        long: 240,
        slower: 320,
      },
      easing: {
        standard: "cubic-bezier(0.4, 0, 0.2, 1)",
        emphasized: "cubic-bezier(0.2, 0, 0, 1)",
        decelerate: "cubic-bezier(0.0, 0, 0.2, 1)",
        accelerate: "cubic-bezier(0.4, 0, 1, 1)",
        linear: "linear",
      },
    },
    interaction: {
      hoverOpacity: 0.03,
      activeOpacity: 0.06,
      disabledOpacity: 0.4,
      transitionDuration: 120,
    },
    components: {
      button: {
        borderRadius: 6,
        fontWeight: 500,
        letterSpacing: "-0.01em",
        textTransform: "none",
      },
      card: {
        borderRadius: 8,
        border: "rgba(24, 24, 27, 0.08)",
        shadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
        hoverShadow: "0 2px 6px rgba(0, 0, 0, 0.06)",
      },
      chip: {
        borderRadius: 6,
      },
    },
  },
};

export const minimalDark: ThemePreset = {
  meta: {
    id: "minimal-dark",
    name: "Minimal Dark",
    description: "Monochrome dark theme with clean lines and subtle depth",
    category: "minimal",
    mode: "dark",
    tags: ["minimal", "dark", "monochrome"],
  },
  tokens: {
    palette: {
      primary: "#fafafa",
      onPrimary: "#18181b",
      primaryLight: "#ffffff",
      primaryDark: "#e4e4e7",
      secondary: "#a1a1aa",
      onSecondary: "#18181b",
      secondaryLight: "#d4d4d8",
      secondaryDark: "#71717a",
      tertiary: "#d4d4d8",
      onTertiary: "#18181b",
      info: "#a1a1aa",
      onInfo: "#18181b",
      background: "#09090b",
      onBackground: "#fafafa",
      backgroundAlt: "#18181b",
      surface: "#18181b",
      onSurface: "#fafafa",
      surfaceAlt: "#27272a",
      error: "#f87171",
      onError: "#18181b",
      errorLight: "rgba(248, 113, 113, 0.12)",
      warning: "#fbbf24",
      onWarning: "#18181b",
      warningLight: "rgba(251, 191, 36, 0.12)",
      success: "#4ade80",
      onSuccess: "#18181b",
      successLight: "rgba(74, 222, 128, 0.12)",
      divider: "rgba(250, 250, 250, 0.06)",
      border: "rgba(250, 250, 250, 0.1)",
      text: {
        primary: "#fafafa",
        secondary: "#a1a1aa",
        tertiary: "#71717a",
        disabled: "#52525b",
        inverse: "#18181b",
        link: "#e4e4e7",
        linkHover: "#ffffff",
      },
    },
    effects: {
      borderRadius: {
        none: 0,
        sm: 4,
        md: 6,
        lg: 8,
        xl: 10,
        full: 9999,
      },
      elevation: {
        none: "none",
        level1: "0 1px 2px rgba(0, 0, 0, 0.2)",
        level2: "0 2px 4px rgba(0, 0, 0, 0.25)",
        level3: "0 3px 8px rgba(0, 0, 0, 0.3)",
        level4: "0 4px 12px rgba(0, 0, 0, 0.35)",
        level5: "0 6px 16px rgba(0, 0, 0, 0.4)",
      },
      depth: "subtle",
      focusRing: {
        color: "rgba(250, 250, 250, 0.3)",
        width: 2,
        offset: 2,
        style: "solid",
      },
      glow: {
        color: "transparent",
        spread: "0 0 0",
        strength: 0,
        appliesTo: {
          button: false,
          card: false,
          paper: false,
          inputFocus: false,
          link: false,
        },
      },
      border: {
        width: {
          none: 0,
          thin: 1,
          medium: 1,
          thick: 2,
        },
        style: {
          solid: "solid",
          dashed: "dashed",
          dotted: "dotted",
        },
      },
    },
    motion: {
      duration: {
        instant: 0,
        fast: 80,
        short: 120,
        medium: 160,
        long: 240,
        slower: 320,
      },
      easing: {
        standard: "cubic-bezier(0.4, 0, 0.2, 1)",
        emphasized: "cubic-bezier(0.2, 0, 0, 1)",
        decelerate: "cubic-bezier(0.0, 0, 0.2, 1)",
        accelerate: "cubic-bezier(0.4, 0, 1, 1)",
        linear: "linear",
      },
    },
    interaction: {
      hoverOpacity: 0.04,
      activeOpacity: 0.08,
      disabledOpacity: 0.4,
      transitionDuration: 120,
    },
    components: {
      button: {
        borderRadius: 6,
        fontWeight: 500,
        letterSpacing: "-0.01em",
        textTransform: "none",
      },
      card: {
        borderRadius: 8,
        border: "rgba(250, 250, 250, 0.08)",
        shadow: "0 1px 3px rgba(0, 0, 0, 0.3)",
        hoverShadow: "0 2px 8px rgba(0, 0, 0, 0.4)",
      },
      chip: {
        borderRadius: 6,
      },
    },
  },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// OCEAN PRESETS - Calming Blue & Teal
// Fresh, calming colors inspired by the ocean
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const oceanLight: ThemePreset = {
  meta: {
    id: "ocean-light",
    name: "Ocean Light",
    description: "Calming blues and teals inspired by the sea",
    category: "ocean",
    mode: "light",
    tags: ["calm", "fresh", "aqua"],
  },
  tokens: {
    palette: {
      primary: "#0891b2",
      onPrimary: "#FFFFFF",
      primaryLight: "#22d3ee",
      primaryDark: "#0e7490",
      secondary: "#0d9488",
      onSecondary: "#FFFFFF",
      secondaryLight: "#2dd4bf",
      secondaryDark: "#0f766e",
      tertiary: "#6366f1",
      onTertiary: "#FFFFFF",
      info: "#0ea5e9",
      onInfo: "#FFFFFF",
      background: "#f0fdfa",
      onBackground: "#134e4a",
      backgroundAlt: "#ccfbf1",
      surface: "#ffffff",
      onSurface: "#115e59",
      surfaceAlt: "#f0fdfa",
      error: "#dc2626",
      onError: "#FFFFFF",
      errorLight: "#fee2e2",
      warning: "#f59e0b",
      onWarning: "#FFFFFF",
      warningLight: "#fef3c7",
      success: "#059669",
      onSuccess: "#FFFFFF",
      successLight: "#d1fae5",
      divider: "rgba(8, 145, 178, 0.1)",
      border: "rgba(8, 145, 178, 0.15)",
      text: {
        primary: "#134e4a",
        secondary: "#115e59",
        tertiary: "#0f766e",
        disabled: "#5eead4",
        inverse: "#FFFFFF",
        link: "#0891b2",
        linkHover: "#0e7490",
      },
      gradientPrimary: "linear-gradient(135deg, #0891b2 0%, #0e7490 100%)",
      gradientSecondary: "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)",
    },
    effects: {
      borderRadius: { sm: 8, md: 12, lg: 16, xl: 20, full: 9999, none: 0 },
      glow: {
        color: "rgba(8, 145, 178, 0.25)",
        spread: "0 0 16px",
        strength: 1,
        appliesTo: {
          button: true,
          card: false,
          paper: false,
          inputFocus: true,
          link: false,
        },
      },
    },
    components: {
      button: { borderRadius: 10, fontWeight: 600, textTransform: "none" },
      card: { borderRadius: 14, shadow: "0 2px 8px rgba(8, 145, 178, 0.08)" },
    },
  },
};

export const oceanDark: ThemePreset = {
  meta: {
    id: "ocean-dark",
    name: "Ocean Dark",
    description: "Deep ocean blues with luminous accents",
    category: "ocean",
    mode: "dark",
    tags: ["calm", "deep", "aqua"],
  },
  tokens: {
    palette: {
      primary: "#22d3ee",
      onPrimary: "#083344",
      primaryLight: "#67e8f9",
      primaryDark: "#06b6d4",
      secondary: "#2dd4bf",
      onSecondary: "#042f2e",
      secondaryLight: "#5eead4",
      secondaryDark: "#14b8a6",
      tertiary: "#a5b4fc",
      onTertiary: "#1e1b4b",
      info: "#38bdf8",
      onInfo: "#0c4a6e",
      background: "#042f2e",
      onBackground: "#ccfbf1",
      backgroundAlt: "#134e4a",
      surface: "rgba(20, 78, 74, 0.9)",
      onSurface: "#99f6e4",
      surfaceAlt: "rgba(13, 148, 136, 0.2)",
      error: "#f87171",
      onError: "#7f1d1d",
      errorLight: "rgba(248, 113, 113, 0.15)",
      warning: "#fbbf24",
      onWarning: "#78350f",
      warningLight: "rgba(251, 191, 36, 0.15)",
      success: "#34d399",
      onSuccess: "#064e3b",
      successLight: "rgba(52, 211, 153, 0.15)",
      divider: "rgba(34, 211, 238, 0.12)",
      border: "rgba(34, 211, 238, 0.15)",
      text: {
        primary: "#ccfbf1",
        secondary: "#99f6e4",
        tertiary: "#5eead4",
        disabled: "#115e59",
        inverse: "#042f2e",
        link: "#22d3ee",
        linkHover: "#67e8f9",
      },
      gradientPrimary: "linear-gradient(135deg, #22d3ee 0%, #06b6d4 100%)",
      gradientSecondary: "linear-gradient(135deg, #2dd4bf 0%, #14b8a6 100%)",
    },
    effects: {
      borderRadius: { sm: 8, md: 12, lg: 16, xl: 20, full: 9999, none: 0 },
      glow: {
        color: "rgba(34, 211, 238, 0.3)",
        spread: "0 0 20px",
        strength: 1.2,
        appliesTo: {
          button: true,
          card: false,
          paper: false,
          inputFocus: true,
          link: false,
        },
      },
    },
    components: {
      button: { borderRadius: 10, fontWeight: 600, textTransform: "none" },
      card: { borderRadius: 14, shadow: "0 4px 16px rgba(0, 0, 0, 0.3)" },
    },
  },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FOREST PRESETS - Natural Greens
// Earthy, natural colors inspired by forests
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const forestLight: ThemePreset = {
  meta: {
    id: "forest-light",
    name: "Forest Light",
    description: "Natural greens with earthy warmth",
    category: "forest",
    mode: "light",
    tags: ["natural", "earthy", "green"],
  },
  tokens: {
    palette: {
      primary: "#16a34a",
      onPrimary: "#FFFFFF",
      primaryLight: "#22c55e",
      primaryDark: "#15803d",
      secondary: "#ca8a04",
      onSecondary: "#FFFFFF",
      secondaryLight: "#eab308",
      secondaryDark: "#a16207",
      tertiary: "#0d9488",
      onTertiary: "#FFFFFF",
      info: "#0284c7",
      onInfo: "#FFFFFF",
      background: "#f0fdf4",
      onBackground: "#14532d",
      backgroundAlt: "#dcfce7",
      surface: "#ffffff",
      onSurface: "#166534",
      surfaceAlt: "#f0fdf4",
      error: "#dc2626",
      onError: "#FFFFFF",
      errorLight: "#fee2e2",
      warning: "#d97706",
      onWarning: "#FFFFFF",
      warningLight: "#fef3c7",
      success: "#059669",
      onSuccess: "#FFFFFF",
      successLight: "#d1fae5",
      divider: "rgba(22, 163, 74, 0.1)",
      border: "rgba(22, 163, 74, 0.15)",
      text: {
        primary: "#14532d",
        secondary: "#166534",
        tertiary: "#15803d",
        disabled: "#86efac",
        inverse: "#FFFFFF",
        link: "#16a34a",
        linkHover: "#15803d",
      },
      gradientPrimary: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
      gradientSecondary: "linear-gradient(135deg, #ca8a04 0%, #a16207 100%)",
    },
    effects: {
      borderRadius: { sm: 6, md: 10, lg: 14, xl: 18, full: 9999, none: 0 },
      glow: {
        color: "rgba(22, 163, 74, 0.2)",
        spread: "0 0 14px",
        strength: 0.9,
        appliesTo: {
          button: true,
          card: false,
          paper: false,
          inputFocus: true,
          link: false,
        },
      },
    },
    components: {
      button: { borderRadius: 8, fontWeight: 600, textTransform: "none" },
      card: { borderRadius: 12, shadow: "0 2px 8px rgba(22, 163, 74, 0.06)" },
    },
  },
};

export const forestDark: ThemePreset = {
  meta: {
    id: "forest-dark",
    name: "Forest Dark",
    description: "Deep forest with glowing emerald accents",
    category: "forest",
    mode: "dark",
    tags: ["natural", "deep", "emerald"],
  },
  tokens: {
    palette: {
      primary: "#4ade80",
      onPrimary: "#052e16",
      primaryLight: "#86efac",
      primaryDark: "#22c55e",
      secondary: "#fbbf24",
      onSecondary: "#422006",
      secondaryLight: "#fcd34d",
      secondaryDark: "#f59e0b",
      tertiary: "#2dd4bf",
      onTertiary: "#042f2e",
      info: "#38bdf8",
      onInfo: "#0c4a6e",
      background: "#052e16",
      onBackground: "#dcfce7",
      backgroundAlt: "#14532d",
      surface: "rgba(22, 101, 52, 0.85)",
      onSurface: "#bbf7d0",
      surfaceAlt: "rgba(34, 197, 94, 0.15)",
      error: "#f87171",
      onError: "#7f1d1d",
      errorLight: "rgba(248, 113, 113, 0.15)",
      warning: "#fbbf24",
      onWarning: "#78350f",
      warningLight: "rgba(251, 191, 36, 0.15)",
      success: "#34d399",
      onSuccess: "#064e3b",
      successLight: "rgba(52, 211, 153, 0.15)",
      divider: "rgba(74, 222, 128, 0.12)",
      border: "rgba(74, 222, 128, 0.15)",
      text: {
        primary: "#dcfce7",
        secondary: "#bbf7d0",
        tertiary: "#86efac",
        disabled: "#166534",
        inverse: "#052e16",
        link: "#4ade80",
        linkHover: "#86efac",
      },
      gradientPrimary: "linear-gradient(135deg, #4ade80 0%, #22c55e 100%)",
      gradientSecondary: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
    },
    effects: {
      borderRadius: { sm: 6, md: 10, lg: 14, xl: 18, full: 9999, none: 0 },
      glow: {
        color: "rgba(74, 222, 128, 0.25)",
        spread: "0 0 18px",
        strength: 1.1,
        appliesTo: {
          button: true,
          card: false,
          paper: false,
          inputFocus: true,
          link: false,
        },
      },
    },
    components: {
      button: { borderRadius: 8, fontWeight: 600, textTransform: "none" },
      card: { borderRadius: 12, shadow: "0 4px 16px rgba(0, 0, 0, 0.3)" },
    },
  },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SUNSET PRESETS - Warm Orange & Coral
// Vibrant, warm colors inspired by sunsets
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const sunsetLight: ThemePreset = {
  meta: {
    id: "sunset-light",
    name: "Sunset Light",
    description: "Warm oranges and corals with golden touches",
    category: "sunset",
    mode: "light",
    tags: ["warm", "vibrant", "coral"],
  },
  tokens: {
    palette: {
      primary: "#ea580c",
      onPrimary: "#FFFFFF",
      primaryLight: "#f97316",
      primaryDark: "#c2410c",
      secondary: "#dc2626",
      onSecondary: "#FFFFFF",
      secondaryLight: "#ef4444",
      secondaryDark: "#b91c1c",
      tertiary: "#d97706",
      onTertiary: "#FFFFFF",
      info: "#0284c7",
      onInfo: "#FFFFFF",
      background: "#fff7ed",
      onBackground: "#431407",
      backgroundAlt: "#ffedd5",
      surface: "#ffffff",
      onSurface: "#7c2d12",
      surfaceAlt: "#fff7ed",
      error: "#dc2626",
      onError: "#FFFFFF",
      errorLight: "#fee2e2",
      warning: "#d97706",
      onWarning: "#FFFFFF",
      warningLight: "#fef3c7",
      success: "#059669",
      onSuccess: "#FFFFFF",
      successLight: "#d1fae5",
      divider: "rgba(234, 88, 12, 0.1)",
      border: "rgba(234, 88, 12, 0.15)",
      text: {
        primary: "#431407",
        secondary: "#7c2d12",
        tertiary: "#c2410c",
        disabled: "#fdba74",
        inverse: "#FFFFFF",
        link: "#ea580c",
        linkHover: "#c2410c",
      },
      gradientPrimary: "linear-gradient(135deg, #ea580c 0%, #c2410c 100%)",
      gradientSecondary: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
    },
    effects: {
      borderRadius: { sm: 8, md: 12, lg: 16, xl: 20, full: 9999, none: 0 },
      glow: {
        color: "rgba(234, 88, 12, 0.25)",
        spread: "0 0 16px",
        strength: 1,
        appliesTo: {
          button: true,
          card: false,
          paper: false,
          inputFocus: true,
          link: false,
        },
      },
    },
    components: {
      button: { borderRadius: 10, fontWeight: 600, textTransform: "none" },
      card: { borderRadius: 14, shadow: "0 2px 8px rgba(234, 88, 12, 0.08)" },
    },
  },
};

export const sunsetDark: ThemePreset = {
  meta: {
    id: "sunset-dark",
    name: "Sunset Dark",
    description: "Deep dusk with glowing ember accents",
    category: "sunset",
    mode: "dark",
    tags: ["warm", "deep", "ember"],
  },
  tokens: {
    palette: {
      primary: "#fb923c",
      onPrimary: "#431407",
      primaryLight: "#fdba74",
      primaryDark: "#f97316",
      secondary: "#f87171",
      onSecondary: "#450a0a",
      secondaryLight: "#fca5a5",
      secondaryDark: "#ef4444",
      tertiary: "#fbbf24",
      onTertiary: "#422006",
      info: "#38bdf8",
      onInfo: "#0c4a6e",
      background: "#1c0a00",
      onBackground: "#ffedd5",
      backgroundAlt: "#431407",
      surface: "rgba(124, 45, 18, 0.85)",
      onSurface: "#fed7aa",
      surfaceAlt: "rgba(249, 115, 22, 0.15)",
      error: "#f87171",
      onError: "#7f1d1d",
      errorLight: "rgba(248, 113, 113, 0.15)",
      warning: "#fbbf24",
      onWarning: "#78350f",
      warningLight: "rgba(251, 191, 36, 0.15)",
      success: "#34d399",
      onSuccess: "#064e3b",
      successLight: "rgba(52, 211, 153, 0.15)",
      divider: "rgba(251, 146, 60, 0.12)",
      border: "rgba(251, 146, 60, 0.15)",
      text: {
        primary: "#ffedd5",
        secondary: "#fed7aa",
        tertiary: "#fdba74",
        disabled: "#7c2d12",
        inverse: "#1c0a00",
        link: "#fb923c",
        linkHover: "#fdba74",
      },
      gradientPrimary: "linear-gradient(135deg, #fb923c 0%, #f97316 100%)",
      gradientSecondary: "linear-gradient(135deg, #f87171 0%, #ef4444 100%)",
    },
    effects: {
      borderRadius: { sm: 8, md: 12, lg: 16, xl: 20, full: 9999, none: 0 },
      glow: {
        color: "rgba(251, 146, 60, 0.3)",
        spread: "0 0 20px",
        strength: 1.2,
        appliesTo: {
          button: true,
          card: false,
          paper: false,
          inputFocus: true,
          link: false,
        },
      },
    },
    components: {
      button: { borderRadius: 10, fontWeight: 600, textTransform: "none" },
      card: { borderRadius: 14, shadow: "0 4px 16px rgba(0, 0, 0, 0.3)" },
    },
  },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ROSE PRESETS - Elegant Pink & Mauve
// Soft, elegant colors with pink and rose tones
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const roseLight: ThemePreset = {
  meta: {
    id: "rose-light",
    name: "Rose Light",
    description: "Elegant pinks with soft mauve accents",
    category: "rose",
    mode: "light",
    tags: ["elegant", "soft", "pink"],
  },
  tokens: {
    palette: {
      primary: "#db2777",
      onPrimary: "#FFFFFF",
      primaryLight: "#ec4899",
      primaryDark: "#be185d",
      secondary: "#8b5cf6",
      onSecondary: "#FFFFFF",
      secondaryLight: "#a78bfa",
      secondaryDark: "#7c3aed",
      tertiary: "#06b6d4",
      onTertiary: "#FFFFFF",
      info: "#0284c7",
      onInfo: "#FFFFFF",
      background: "#fdf2f8",
      onBackground: "#500724",
      backgroundAlt: "#fce7f3",
      surface: "#ffffff",
      onSurface: "#831843",
      surfaceAlt: "#fdf2f8",
      error: "#dc2626",
      onError: "#FFFFFF",
      errorLight: "#fee2e2",
      warning: "#d97706",
      onWarning: "#FFFFFF",
      warningLight: "#fef3c7",
      success: "#059669",
      onSuccess: "#FFFFFF",
      successLight: "#d1fae5",
      divider: "rgba(219, 39, 119, 0.1)",
      border: "rgba(219, 39, 119, 0.15)",
      text: {
        primary: "#500724",
        secondary: "#831843",
        tertiary: "#be185d",
        disabled: "#f9a8d4",
        inverse: "#FFFFFF",
        link: "#db2777",
        linkHover: "#be185d",
      },
      gradientPrimary: "linear-gradient(135deg, #db2777 0%, #be185d 100%)",
      gradientSecondary: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
    },
    effects: {
      borderRadius: { sm: 10, md: 14, lg: 18, xl: 24, full: 9999, none: 0 },
      glow: {
        color: "rgba(219, 39, 119, 0.2)",
        spread: "0 0 16px",
        strength: 1,
        appliesTo: {
          button: true,
          card: false,
          paper: false,
          inputFocus: true,
          link: false,
        },
      },
    },
    components: {
      button: { borderRadius: 12, fontWeight: 600, textTransform: "none" },
      card: { borderRadius: 16, shadow: "0 2px 8px rgba(219, 39, 119, 0.06)" },
    },
  },
};

export const roseDark: ThemePreset = {
  meta: {
    id: "rose-dark",
    name: "Rose Dark",
    description: "Deep mauve with luminous pink accents",
    category: "rose",
    mode: "dark",
    tags: ["elegant", "deep", "mauve"],
  },
  tokens: {
    palette: {
      primary: "#f472b6",
      onPrimary: "#500724",
      primaryLight: "#f9a8d4",
      primaryDark: "#ec4899",
      secondary: "#c4b5fd",
      onSecondary: "#2e1065",
      secondaryLight: "#ddd6fe",
      secondaryDark: "#a78bfa",
      tertiary: "#22d3ee",
      onTertiary: "#083344",
      info: "#38bdf8",
      onInfo: "#0c4a6e",
      background: "#1a0612",
      onBackground: "#fce7f3",
      backgroundAlt: "#500724",
      surface: "rgba(131, 24, 67, 0.85)",
      onSurface: "#fbcfe8",
      surfaceAlt: "rgba(236, 72, 153, 0.15)",
      error: "#f87171",
      onError: "#7f1d1d",
      errorLight: "rgba(248, 113, 113, 0.15)",
      warning: "#fbbf24",
      onWarning: "#78350f",
      warningLight: "rgba(251, 191, 36, 0.15)",
      success: "#34d399",
      onSuccess: "#064e3b",
      successLight: "rgba(52, 211, 153, 0.15)",
      divider: "rgba(244, 114, 182, 0.12)",
      border: "rgba(244, 114, 182, 0.15)",
      text: {
        primary: "#fce7f3",
        secondary: "#fbcfe8",
        tertiary: "#f9a8d4",
        disabled: "#831843",
        inverse: "#1a0612",
        link: "#f472b6",
        linkHover: "#f9a8d4",
      },
      gradientPrimary: "linear-gradient(135deg, #f472b6 0%, #ec4899 100%)",
      gradientSecondary: "linear-gradient(135deg, #c4b5fd 0%, #a78bfa 100%)",
    },
    effects: {
      borderRadius: { sm: 10, md: 14, lg: 18, xl: 24, full: 9999, none: 0 },
      glow: {
        color: "rgba(244, 114, 182, 0.3)",
        spread: "0 0 20px",
        strength: 1.2,
        appliesTo: {
          button: true,
          card: false,
          paper: false,
          inputFocus: true,
          link: false,
        },
      },
    },
    components: {
      button: { borderRadius: 12, fontWeight: 600, textTransform: "none" },
      card: { borderRadius: 16, shadow: "0 4px 16px rgba(0, 0, 0, 0.3)" },
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
  ocean: {
    light: oceanLight,
    dark: oceanDark,
  },
  forest: {
    light: forestLight,
    dark: forestDark,
  },
  sunset: {
    light: sunsetLight,
    dark: sunsetDark,
  },
  rose: {
    light: roseLight,
    dark: roseDark,
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
  "ocean-light": oceanLight,
  "ocean-dark": oceanDark,
  "forest-light": forestLight,
  "forest-dark": forestDark,
  "sunset-light": sunsetLight,
  "sunset-dark": sunsetDark,
  "rose-light": roseLight,
  "rose-dark": roseDark,
  "accessible-light": accessibleLight,
  "accessible-dark": accessibleDark,
  "minimal-light": minimalLight,
  "minimal-dark": minimalDark,
} as const;
