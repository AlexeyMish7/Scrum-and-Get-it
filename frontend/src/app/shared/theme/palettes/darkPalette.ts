import type { BaseTokens } from "../types";

/**
 * Dark Mode Design Tokens v2.0
 *
 * A refined, modern dark theme with:
 * - Deep slate backgrounds for comfort
 * - Vibrant blue accents for energy
 * - Soft glows and subtle depth
 * - High contrast for readability
 * - Glass morphism effects
 */
const darkPaletteTokens: BaseTokens = {
  mode: "dark",

  // =========================================================================
  // PALETTE - Colors for all UI elements
  // =========================================================================
  palette: {
    // Primary brand color (vibrant blue)
    primary: "#3b82f6",
    onPrimary: "#FFFFFF",
    primaryLight: "#60a5fa",
    primaryDark: "#2563eb",

    // Secondary color (violet)
    secondary: "#8b5cf6",
    onSecondary: "#FFFFFF",
    secondaryLight: "#a78bfa",
    secondaryDark: "#7c3aed",

    // Tertiary accent (rose)
    tertiary: "#f43f5e",
    onTertiary: "#FFFFFF",

    // Info color (cyan) - bright and distinct
    info: "#22d3ee",
    onInfo: "#0f172a",

    // Backgrounds - deep slate
    background: "#0c1222",
    onBackground: "#f1f5f9",
    backgroundAlt: "#111827",

    // Surfaces (cards, dialogs, etc.) - slightly elevated
    surface: "rgba(17, 24, 39, 0.95)",
    onSurface: "#e2e8f0",
    surfaceAlt: "rgba(30, 41, 59, 0.85)",

    // Semantic colors
    error: "#f87171",
    onError: "#0f172a",
    errorLight: "rgba(248, 113, 113, 0.15)",

    warning: "#fbbf24",
    onWarning: "#0f172a",
    warningLight: "rgba(251, 191, 36, 0.15)",

    success: "#34d399",
    onSuccess: "#0f172a",
    successLight: "rgba(52, 211, 153, 0.15)",

    // Borders and dividers
    divider: "rgba(148, 163, 184, 0.1)",
    border: "rgba(148, 163, 184, 0.12)",

    // Text colors
    text: {
      primary: "#f1f5f9",
      secondary: "#94a3b8",
      tertiary: "#64748b",
      disabled: "#475569",
      inverse: "#0f172a",
      link: "#60a5fa",
      linkHover: "#93c5fd",
    },

    // Neutral scale (slate - inverted for dark mode)
    neutral: {
      50: "#020617",
      100: "#0f172a",
      200: "#1e293b",
      300: "#334155",
      400: "#475569",
      500: "#64748b",
      600: "#94a3b8",
      700: "#cbd5e1",
      800: "#e2e8f0",
      900: "#f1f5f9",
      950: "#f8fafc",
    },

    // Gradients
    gradientPrimary: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
    gradientSecondary: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
    gradientAccent:
      "linear-gradient(135deg, #8b5cf6 0%, #3b82f6 50%, #22d3ee 100%)",
    gradientBackground: "linear-gradient(180deg, #0c1222 0%, #111827 100%)",

    // App bar (navigation header) - glass effect
    appBar: {
      bg: "rgba(12, 18, 34, 0.9)",
      color: "#f1f5f9",
      border: "rgba(148, 163, 184, 0.08)",
      glassOpacity: 0.9,
      blur: 24,
    },

    // Sidebar
    sidebar: {
      bg: "rgba(17, 24, 39, 0.98)",
      color: "#cbd5e1",
      border: "rgba(148, 163, 184, 0.08)",
      activeItemBg: "rgba(59, 130, 246, 0.15)",
      hoverItemBg: "rgba(59, 130, 246, 0.08)",
    },

    // Footer
    footer: {
      bg: "#0c1222",
      color: "#94a3b8",
      border: "rgba(148, 163, 184, 0.08)",
    },
  },

  // =========================================================================
  // TYPOGRAPHY - Font settings
  // =========================================================================
  typography: {
    fontFamily: {
      heading: '"Inter", "Segoe UI", -apple-system, sans-serif',
      body: '"Inter", "Segoe UI", -apple-system, sans-serif',
      mono: '"JetBrains Mono", "Fira Code", "Consolas", monospace',
    },
    fontSize: {
      xs: "0.75rem",
      sm: "0.875rem",
      md: "1rem",
      lg: "1.125rem",
      xl: "1.25rem",
      "2xl": "1.5rem",
      "3xl": "1.875rem",
      "4xl": "2.25rem",
      "5xl": "3rem",
    },
    fontWeight: {
      light: 300,
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
    letterSpacing: {
      tight: "-0.02em",
      normal: "0",
      wide: "0.02em",
      wider: "0.05em",
    },
  },

  // =========================================================================
  // SPACING - Consistent spacing scale
  // =========================================================================
  spacing: {
    unit: 4,
    scale: {
      none: 0,
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
      "2xl": 48,
      "3xl": 64,
    },
    container: {
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      full: "100%",
    },
  },

  // =========================================================================
  // EFFECTS - Shadows, borders, visual effects
  // =========================================================================
  effects: {
    elevation: {
      none: "none",
      level1: "0 1px 2px rgba(0, 0, 0, 0.25), 0 1px 4px rgba(0, 0, 0, 0.15)",
      level2: "0 2px 6px rgba(0, 0, 0, 0.3), 0 4px 12px rgba(0, 0, 0, 0.2)",
      level3: "0 4px 12px rgba(0, 0, 0, 0.35), 0 8px 24px rgba(0, 0, 0, 0.25)",
      level4: "0 8px 20px rgba(0, 0, 0, 0.4), 0 16px 40px rgba(0, 0, 0, 0.3)",
      level5:
        "0 16px 32px rgba(0, 0, 0, 0.45), 0 24px 56px rgba(0, 0, 0, 0.35)",
    },
    depth: "subtle",
    focusRing: {
      color: "rgba(59, 130, 246, 0.4)",
      width: 3,
      offset: 2,
      style: "solid",
    },
    glow: {
      color: "rgba(59, 130, 246, 0.3)",
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
    overlay: {
      backdropColor: "rgba(0, 0, 0, 0.6)",
      opacity: 1,
    },
    borderRadius: {
      none: 0,
      sm: 6,
      md: 10,
      lg: 14,
      xl: 20,
      full: 9999,
    },
    border: {
      width: {
        none: 0,
        thin: 1,
        medium: 2,
        thick: 4,
      },
      style: {
        solid: "solid",
        dashed: "dashed",
        dotted: "dotted",
      },
    },
    glass: {
      blur: 24,
      opacity: 0.85,
      saturation: 1.4,
    },
  },

  // =========================================================================
  // MOTION - Animation and transition settings
  // =========================================================================
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
      elastic: "cubic-bezier(0.5, 1.5, 0.5, 1)",
    },
    reducedMotion: false,
  },

  // =========================================================================
  // INTERACTION - Hover, active, and disabled states
  // =========================================================================
  interaction: {
    hoverOpacity: 0.06,
    activeOpacity: 0.12,
    disabledOpacity: 0.4,
    hoverOverlay: "rgba(255, 255, 255, 0.04)",
    activeOverlay: "rgba(255, 255, 255, 0.08)",
    hoverElevationScale: 1.2,
    activeElevationScale: 1.3,
    hoverGlow: true,
    activeGlow: true,
    pressTransform: "scale(0.98)",
    hoverScale: "scale(1.01)",
    transitionDuration: 150,
  },

  // =========================================================================
  // INPUT - Form input styling
  // =========================================================================
  input: {
    bg: "rgba(255, 255, 255, 0.04)",
    bgFocus: "rgba(255, 255, 255, 0.06)",
    bgDisabled: "rgba(255, 255, 255, 0.02)",
    border: "rgba(148, 163, 184, 0.2)",
    borderFocus: "#3b82f6",
    borderError: "#f87171",
    borderSuccess: "#34d399",
    text: "#f1f5f9",
    placeholder: "rgba(148, 163, 184, 0.6)",
    size: {
      sm: { height: 36, padding: "6px 12px", fontSize: "0.875rem" },
      md: { height: 44, padding: "10px 14px", fontSize: "1rem" },
      lg: { height: 52, padding: "14px 18px", fontSize: "1.125rem" },
    },
  },

  // =========================================================================
  // COMPONENTS - Component-specific tokens
  // =========================================================================
  components: {
    button: {
      borderRadius: 10,
      fontWeight: 600,
      letterSpacing: "0.01em",
      textTransform: "none",
      size: {
        sm: { height: 34, padding: "6px 14px", fontSize: "0.875rem" },
        md: { height: 42, padding: "8px 18px", fontSize: "0.9375rem" },
        lg: { height: 50, padding: "10px 26px", fontSize: "1rem" },
      },
    },
    card: {
      bg: "rgba(17, 24, 39, 0.95)",
      border: "rgba(148, 163, 184, 0.08)",
      borderRadius: 14,
      padding: "20px",
      shadow: "0 2px 6px rgba(0, 0, 0, 0.25), 0 4px 12px rgba(0, 0, 0, 0.15)",
      hoverShadow:
        "0 4px 16px rgba(59, 130, 246, 0.1), 0 8px 24px rgba(0, 0, 0, 0.25)",
    },
    chip: {
      borderRadius: 9999,
      fontSize: "0.8125rem",
      height: {
        sm: 26,
        md: 32,
        lg: 40,
      },
    },
    avatar: {
      size: {
        xs: 28,
        sm: 36,
        md: 44,
        lg: 60,
        xl: 88,
      },
      borderRadius: 9999,
      border: "2px solid rgba(148, 163, 184, 0.15)",
    },
    skeleton: {
      bg: "rgba(255, 255, 255, 0.06)",
      highlight: "rgba(255, 255, 255, 0.1)",
      animationDuration: 1400,
      borderRadius: 6,
    },
    table: {
      headerBg: "rgba(17, 24, 39, 0.98)",
      headerColor: "#f1f5f9",
      rowHoverBg: "rgba(59, 130, 246, 0.08)",
      stripedBg: "rgba(255, 255, 255, 0.02)",
      borderColor: "rgba(148, 163, 184, 0.08)",
      cellPadding: "14px 18px",
    },
    badge: {
      size: {
        sm: 18,
        md: 22,
        lg: 26,
      },
      fontSize: "0.75rem",
      borderRadius: 9999,
    },
    // Animated gradient background colors (dark mode - deep purples and blues)
    gradientAnimation: {
      gradientBackgroundStart: "rgb(12, 18, 34)",
      gradientBackgroundEnd: "rgb(17, 24, 39)",
      firstColor: "139, 92, 246", // violet
      secondColor: "168, 85, 247", // purple
      thirdColor: "59, 130, 246", // blue
      fourthColor: "244, 63, 94", // rose
      fifthColor: "52, 211, 153", // emerald
      pointerColor: "99, 102, 241", // indigo
    },
  },
};

export default darkPaletteTokens;
