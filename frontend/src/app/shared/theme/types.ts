/**
 * Theme design tokens and type definitions
 *
 * Design tokens define the visual language of the application.
 * MUI type augmentations are in mui-augmentations.d.ts
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
  /** Depth preset controlling how strong elevation/shadows appear */
  depth?: "flat" | "subtle" | "normal" | "strong";
  focusRing: {
    color: string;
    width: number; // in px
    offset?: number; // in px
    style?: "solid" | "dashed";
  };
  /** Optional soft glow effect applied to focus/hoverable components */
  glow?: {
    color: string; // rgba color used in box-shadow glow
    spread: string; // e.g., "0 0 12px"
    /** Optional strength multiplier (1 = as-is). Can influence blur/spread in factory. */
    strength?: number;
    /** Which components should render a glow by default (theme-driven) */
    appliesTo?: {
      button?: boolean;
      card?: boolean;
      paper?: boolean;
      inputFocus?: boolean;
    };
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

/** Interaction and control-level tokens */
export interface InteractionTokens {
  hoverOpacity: number; // 0..1 applied to hover state
  activeOpacity: number; // 0..1 applied to active/pressed state
  hoverOverlay?: string; // rgba overlay color for hover backgrounds
  activeOverlay?: string; // rgba overlay color for active backgrounds
  hoverElevationScale?: number; // scales shadow alpha on hover
  activeElevationScale?: number; // scales shadow alpha on active
  hoverGlow?: boolean; // enable glow on hover regardless of base appliesTo.button
  activeGlow?: boolean; // enable glow on active
  pressTransform?: string; // e.g., 'scale(0.99)' for press feedback
}

/** Input control visuals (helps ensure contrast in dark mode) */
export interface InputTokens {
  bg: string; // background color for inputs (e.g., OutlinedInput root)
  border?: string; // default border color (optional)
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
  /** App navigation bar styling (glassy header) */
  appBar?: {
    bg: string; // base color for nav bar
    color?: string; // foreground/text color for nav items
    border?: string; // bottom border color
    glassOpacity?: number; // 0..1 used to alpha the bg
    blur?: number; // px for backdrop-filter blur
  };
}

export interface BaseTokens {
  mode: ThemeMode;
  palette: PaletteTokens;
  effects: EffectsTokens;
  motion: MotionTokens;
  interaction?: InteractionTokens;
  input?: InputTokens;
}

export type DesignTokens = BaseTokens;
