import type { BaseTokens } from "../types";

/**
 * Light Mode Design Tokens v2.0
 *
 * A refined, professional light theme with:
 * - Clean white/slate surfaces for clarity
 * - Vibrant blue primary for clear CTAs
 * - Subtle shadows with soft depth
 * - Accessible color contrast
 * - Glass morphism effects
 */
const lightPaletteTokens: BaseTokens = {
  mode: "light",

  // =========================================================================
  // PALETTE - Colors for all UI elements
  // =========================================================================
  palette: {
    // Primary brand color (vibrant blue)
    primary: "#2563eb",
    onPrimary: "#FFFFFF",
    primaryLight: "#60a5fa",
    primaryDark: "#1d4ed8",

    // Secondary color (violet)
    secondary: "#7c3aed",
    onSecondary: "#FFFFFF",
    secondaryLight: "#a78bfa",
    secondaryDark: "#5b21b6",

    // Tertiary accent (rose)
    tertiary: "#e11d48",
    onTertiary: "#FFFFFF",

    // Info color (sky blue) - distinct from primary
    info: "#0ea5e9",
    onInfo: "#FFFFFF",

    // Backgrounds
    background: "#fafbfc",
    onBackground: "#0f172a",
    backgroundAlt: "#f1f5f9",

    // Surfaces (cards, dialogs, etc.)
    surface: "rgba(255, 255, 255, 0.98)",
    onSurface: "#1e293b",
    surfaceAlt: "#f8fafc",

    // Semantic colors
    error: "#dc2626",
    onError: "#FFFFFF",
    errorLight: "#fecaca",

    warning: "#f59e0b",
    onWarning: "#000000",
    warningLight: "#fef3c7",

    success: "#059669",
    onSuccess: "#FFFFFF",
    successLight: "#d1fae5",

    // Borders and dividers
    divider: "rgba(100, 116, 139, 0.15)",
    border: "rgba(100, 116, 139, 0.2)",

    // Text colors
    text: {
      primary: "#0f172a",
      secondary: "#475569",
      tertiary: "#64748b",
      disabled: "#94a3b8",
      inverse: "#f8fafc",
      link: "#2563eb",
      linkHover: "#1d4ed8",
    },

    // Neutral scale (slate)
    neutral: {
      50: "#f8fafc",
      100: "#f1f5f9",
      200: "#e2e8f0",
      300: "#cbd5e1",
      400: "#94a3b8",
      500: "#64748b",
      600: "#475569",
      700: "#334155",
      800: "#1e293b",
      900: "#0f172a",
      950: "#020617",
    },

    // Gradients
    gradientPrimary: "linear-gradient(135deg, #2563eb 0%, #1e40af 100%)",
    gradientSecondary: "linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)",
    gradientAccent:
      "linear-gradient(135deg, #7c3aed 0%, #2563eb 50%, #0ea5e9 100%)",
    gradientBackground: "linear-gradient(180deg, #fafbfc 0%, #f1f5f9 100%)",

    // App bar (navigation header)
    appBar: {
      bg: "#ffffff",
      color: "#0f172a",
      border: "rgba(100, 116, 139, 0.12)",
      glassOpacity: 0.92,
      blur: 20,
    },

    // Sidebar
    sidebar: {
      bg: "#ffffff",
      color: "#334155",
      border: "rgba(100, 116, 139, 0.12)",
      activeItemBg: "rgba(37, 99, 235, 0.1)",
      hoverItemBg: "rgba(37, 99, 235, 0.05)",
    },

    // Footer
    footer: {
      bg: "#f8fafc",
      color: "#64748b",
      border: "rgba(100, 116, 139, 0.12)",
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
      level1: "0 1px 2px rgba(0, 0, 0, 0.03), 0 1px 3px rgba(0, 0, 0, 0.05)",
      level2: "0 2px 4px rgba(0, 0, 0, 0.04), 0 4px 8px rgba(0, 0, 0, 0.06)",
      level3: "0 4px 8px rgba(0, 0, 0, 0.05), 0 8px 16px rgba(0, 0, 0, 0.08)",
      level4: "0 8px 16px rgba(0, 0, 0, 0.06), 0 16px 32px rgba(0, 0, 0, 0.1)",
      level5:
        "0 16px 32px rgba(0, 0, 0, 0.08), 0 24px 48px rgba(0, 0, 0, 0.12)",
    },
    depth: "subtle",
    focusRing: {
      color: "rgba(37, 99, 235, 0.35)",
      width: 3,
      offset: 2,
      style: "solid",
    },
    glow: {
      color: "rgba(37, 99, 235, 0.2)",
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
    overlay: {
      backdropColor: "rgba(15, 23, 42, 0.4)",
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
      blur: 20,
      opacity: 0.92,
      saturation: 1.3,
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
    hoverOpacity: 0.04,
    activeOpacity: 0.1,
    disabledOpacity: 0.4,
    hoverOverlay: "rgba(0, 0, 0, 0.03)",
    activeOverlay: "rgba(0, 0, 0, 0.06)",
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
    bg: "transparent",
    bgFocus: "#ffffff",
    bgDisabled: "rgba(100, 116, 139, 0.06)",
    border: "rgba(100, 116, 139, 0.25)",
    borderFocus: "#2563eb",
    borderError: "#dc2626",
    borderSuccess: "#059669",
    text: "#0f172a",
    placeholder: "#94a3b8",
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
      bg: "rgba(255, 255, 255, 0.98)",
      border: "rgba(100, 116, 139, 0.1)",
      borderRadius: 14,
      padding: "20px",
      shadow: "0 1px 2px rgba(0, 0, 0, 0.03), 0 2px 6px rgba(0, 0, 0, 0.05)",
      hoverShadow:
        "0 4px 12px rgba(0, 0, 0, 0.06), 0 6px 16px rgba(0, 0, 0, 0.08)",
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
      border: "2px solid rgba(255, 255, 255, 0.95)",
    },
    skeleton: {
      bg: "rgba(100, 116, 139, 0.08)",
      highlight: "rgba(100, 116, 139, 0.04)",
      animationDuration: 1400,
      borderRadius: 6,
    },
    table: {
      headerBg: "#f8fafc",
      headerColor: "#1e293b",
      rowHoverBg: "rgba(37, 99, 235, 0.04)",
      stripedBg: "rgba(100, 116, 139, 0.03)",
      borderColor: "rgba(100, 116, 139, 0.12)",
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
    // Animated gradient background colors (light mode - soft, pastel tones)
    gradientAnimation: {
      gradientBackgroundStart: "rgb(250, 251, 252)",
      gradientBackgroundEnd: "rgb(241, 245, 249)",
      firstColor: "124, 58, 237", // violet
      secondColor: "236, 72, 153", // pink
      thirdColor: "37, 99, 235", // blue
      fourthColor: "245, 158, 11", // amber
      fifthColor: "5, 150, 105", // emerald
      pointerColor: "139, 92, 246", // purple
    },
  },
};

export default lightPaletteTokens;
