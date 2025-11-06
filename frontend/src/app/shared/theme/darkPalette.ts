import type { BaseTokens } from "./types";

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
    surface: "rgba(6, 16, 24, 0.6)",
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
  },
  effects: {
    elevation: {
      level1: "0 1px 3px rgba(0,0,0,0.2)",
      level2: "0 2px 6px rgba(0,0,0,0.24)",
      level3: "0 8px 20px rgba(0,229,255,0.08)",
      level4: "0 12px 28px rgba(0,229,255,0.06)",
      level5: "0 20px 40px rgba(4,12,24,0.55)",
    },
    focusRing: { color: "rgba(76,157,255,0.3)", width: 3, offset: 2 },
    overlay: { backdropColor: "rgba(12,18,26,0.9)", opacity: 1 },
    borderRadius: { sm: 8, md: 12, lg: 12, xl: 16, pill: 999 },
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
};

export default darkPaletteTokens;
