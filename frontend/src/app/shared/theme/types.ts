/**
 * Theme design tokens and MUI typings augmentation
 */

export type ThemeMode = "light" | "dark";

export interface MotionTokens {
  duration: {
    short: number; // e.g., 120ms
    medium: number; // e.g., 200-250ms
    long: number; // e.g., 300-400ms
  };
  easing: {
    standard: string; // cubic-bezier()
    emphasized: string; // cubic-bezier()
    decelerate: string; // cubic-bezier()
    accelerate: string; // cubic-bezier()
  };
}

export interface EffectsTokens {
  elevation: {
    level1: string; // box-shadow for low elevation surfaces
    level2: string;
    level3: string;
    level4?: string;
    level5?: string;
  };
  focusRing: {
    color: string;
    width: number; // in px
    offset?: number; // in px
    style?: "solid" | "dashed";
  };
  overlay: {
    backdropColor: string;
    opacity: number; // 0..1
  };
  borderRadius: {
    sm: number; // in px
    md: number;
    lg: number;
    xl?: number;
    pill?: number; // large rounding for chips/buttons
  };
}

export interface PaletteTokens {
  // Core brand scales (use main colors; factory maps these into MUI palette)
  primary: string;
  onPrimary: string;

  secondary: string;
  onSecondary: string;

  tertiary: string;
  onTertiary: string;

  background: string;
  onBackground: string;

  surface: string; // cards/surfaces background
  onSurface: string; // default text on surfaces

  error: string;
  onError: string;

  warning: string;
  onWarning: string;

  success: string;
  onSuccess: string;

  divider: string;

  // Optional accents
  gradientPrimary?: string; // e.g., linear-gradient(...)
  gradientAccent?: string;
}

export interface BaseTokens {
  mode: ThemeMode;
  palette: PaletteTokens;
  effects: EffectsTokens;
  motion: MotionTokens;
}

export type DesignTokens = BaseTokens;

// -----------------------------
// MUI typings augmentation
// -----------------------------
declare module "@mui/material/styles" {
  interface Theme {
    designTokens: DesignTokens;
  }
  interface ThemeOptions {
    designTokens?: Partial<DesignTokens>;
  }

  interface Palette {
    tertiary: Palette["primary"]; // custom third color scale
  }
  interface PaletteOptions {
    tertiary?: PaletteOptions["primary"]; // allow configuring in theme options
  }
}
