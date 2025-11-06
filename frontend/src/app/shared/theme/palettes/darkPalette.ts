import type { BaseTokens } from "../types";

// Conservative, accessible dark tokens approximating current dark theme
const darkPaletteTokens: BaseTokens = {
  mode: "dark",
  palette: {
    primary: "#3F7BFF",
    onPrimary: "#F5F8FF",
    secondary: "#00E5FF",
    onSecondary: "#061018",
    tertiary: "#7BAFFF",
    onTertiary: "#061018",
    background: "#001F24",
    onBackground: "#DDEBFF",
    // Make surfaces nearly opaque to avoid see-through inputs/dialogs in dark mode
    surface: "rgba(6, 16, 24, 0.95)",
    onSurface: "rgba(189,214,255,0.82)",
    error: "#FF5573",
    onError: "#0B121C",
    warning: "#FFC857",
    onWarning: "#0B121C",
    success: "#35F0B2",
    onSuccess: "#0B121C",
    divider: "rgba(123, 233, 255, 0.18)",
    gradientPrimary:
      "linear-gradient(135deg, #4C9DFF 0%, #3F7BFF 45%, #1F4ED8 100%)",
    gradientAccent: "linear-gradient(135deg, #4C9DFF, #00E5FF)",
    appBar: {
      bg: "#0B121C",
      color: "rgba(221,235,255,0.92)",
      border: "rgba(123, 233, 255, 0.18)",
      glassOpacity: 0.8,
      blur: 16,
    },
  },
  effects: {
    elevation: {
      level1: "0 1px 3px rgba(0,0,0,0.2)",
      level2: "0 2px 6px rgba(0,0,0,0.24)",
      level3: "0 8px 20px rgba(0,229,255,0.08)",
      level4: "0 12px 28px rgba(0,229,255,0.06)",
      level5: "0 20px 40px rgba(4,12,24,0.55)",
    },
    depth: "subtle",
    focusRing: { color: "rgba(76,157,255,0.3)", width: 3, offset: 2 },
    glow: {
      color: "rgba(76, 157, 255, 0.35)",
      spread: "0 0 12px",
      strength: 1,
      appliesTo: { button: true, card: false, paper: false, inputFocus: true },
    },
    overlay: { backdropColor: "rgba(12,18,26,0.9)", opacity: 1 },
    // Very small radii globally (barely noticeable)
    borderRadius: { sm: 2, md: 4, lg: 6, xl: 8, pill: 999 },
  },
  motion: {
    duration: { short: 140, medium: 220, long: 320 },
    easing: {
      standard: "cubic-bezier(0.4, 0, 0.2, 1)",
      emphasized: "cubic-bezier(.22,.61,.36,1)",
      decelerate: "cubic-bezier(0.0, 0, 0.2, 1)",
      accelerate: "cubic-bezier(0.4, 0, 1, 1)",
    },
  },
  interaction: {
    hoverOpacity: 0.06,
    activeOpacity: 0.12,
    hoverOverlay: "rgba(255,255,255,0.06)",
    activeOverlay: "rgba(255,255,255,0.12)",
    hoverElevationScale: 1.1,
    activeElevationScale: 1.25,
    hoverGlow: true,
    activeGlow: true,
    pressTransform: "scale(0.99)",
  },
  // Slightly stronger input background & border for better contrast
  input: { bg: "rgba(255,255,255,0.08)", border: "rgba(255,255,255,0.16)" },
};

export default darkPaletteTokens;
