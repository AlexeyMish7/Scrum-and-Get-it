import type { BaseTokens } from "../types";

// Conservative, accessible light tokens approximating current light theme
const lightPaletteTokens: BaseTokens = {
  mode: "light",
  palette: {
    primary: "#3b82f6",
    onPrimary: "#FFFFFF",
    secondary: "#6366f1",
    onSecondary: "#FFFFFF",
    tertiary: "#f97316",
    onTertiary: "#FFFFFF",
    background: "#f8fafc",
    onBackground: "#0f172a",
    surface: "rgba(255, 255, 255, 0.95)",
    onSurface: "#334155",
    error: "#ef4444",
    onError: "#FFFFFF",
    warning: "#f59e0b",
    onWarning: "#000000",
    success: "#10b981",
    onSuccess: "#FFFFFF",
    divider: "rgba(148, 163, 184, 0.2)",
    gradientPrimary: "linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)",
    gradientAccent:
      "linear-gradient(135deg, #6366f1 0%, #3b82f6 50%, #06b6d4 100%)",
    appBar: {
      bg: "#ffffff",
      color: "#0f172a",
      border: "rgba(148, 163, 184, 0.2)",
      glassOpacity: 0.2,
      blur: 16,
    },
  },
  effects: {
    elevation: {
      level1: "0 8px 32px rgba(16, 24, 40, 0.08)",
      level2: "0 12px 40px rgba(16, 24, 40, 0.12)",
      level3: "0 16px 64px rgba(16, 24, 40, 0.10)",
      level4: "0 2px 8px rgba(16, 24, 40, 0.10)",
      level5: "0 0 0 4px rgba(59, 130, 246, 0.2)",
    },
    depth: "subtle",
    focusRing: { color: "rgba(59,130,246,0.35)", width: 3, offset: 2 },
    glow: {
      color: "rgba(59, 130, 246, 0.30)",
      spread: "0 0 10px",
      strength: 1,
      appliesTo: { button: true, card: false, paper: false, inputFocus: true },
    },
    overlay: { backdropColor: "rgba(16, 24, 40, 0.1)", opacity: 1 },
    // Very small radii globally (barely noticeable)
    borderRadius: { sm: 2, md: 4, lg: 6, xl: 8, pill: 999 },
  },
  motion: {
    duration: { short: 140, medium: 220, long: 320 },
    easing: {
      standard: "cubic-bezier(0.4, 0, 0.2, 1)",
      emphasized: "cubic-bezier(0.2, 0.8, 0.2, 1)",
      decelerate: "cubic-bezier(0.0, 0, 0.2, 1)",
      accelerate: "cubic-bezier(0.4, 0, 1, 1)",
    },
  },
  // Interaction state customization (theme-driven)
  interaction: {
    hoverOpacity: 0.06,
    activeOpacity: 0.12,
    hoverOverlay: "rgba(0,0,0,0.04)",
    activeOverlay: "rgba(0,0,0,0.08)",
    hoverElevationScale: 1.1,
    activeElevationScale: 1.25,
    hoverGlow: true,
    activeGlow: true,
    pressTransform: "scale(0.99)",
  },
  input: { bg: "rgba(0,0,0,0.03)", border: "rgba(0,0,0,0.08)" },
};

export default lightPaletteTokens;
