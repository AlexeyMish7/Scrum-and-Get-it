/**
 * Theme design tokens and type definitions
 *
 * Design tokens define the visual language of the application.
 * This expanded token system provides granular control over:
 * - Colors (palette, semantic, neutrals)
 * - Typography (fonts, sizes, weights)
 * - Spacing (consistent scale)
 * - Effects (shadows, borders, glows)
 * - Motion (animations, transitions)
 * - Components (buttons, cards, inputs, etc.)
 *
 * MUI type augmentations are in mui-augmentations.d.ts
 */

export type ThemeMode = "light" | "dark";

// ============================================================================
// TYPOGRAPHY TOKENS
// ============================================================================

export interface FontFamilyTokens {
  /** Primary font for headings and UI */
  heading: string;
  /** Body text font */
  body: string;
  /** Monospace font for code */
  mono: string;
}

export interface FontSizeTokens {
  xs: string; // 0.75rem (12px)
  sm: string; // 0.875rem (14px)
  md: string; // 1rem (16px)
  lg: string; // 1.125rem (18px)
  xl: string; // 1.25rem (20px)
  "2xl": string; // 1.5rem (24px)
  "3xl": string; // 1.875rem (30px)
  "4xl": string; // 2.25rem (36px)
  "5xl": string; // 3rem (48px)
}

export interface FontWeightTokens {
  light: number;
  regular: number;
  medium: number;
  semibold: number;
  bold: number;
}

export interface LineHeightTokens {
  tight: number; // 1.25
  normal: number; // 1.5
  relaxed: number; // 1.75
}

export interface LetterSpacingTokens {
  tight: string; // -0.02em
  normal: string; // 0
  wide: string; // 0.02em
  wider: string; // 0.05em
}

export interface TypographyTokens {
  fontFamily: FontFamilyTokens;
  fontSize: FontSizeTokens;
  fontWeight: FontWeightTokens;
  lineHeight: LineHeightTokens;
  letterSpacing: LetterSpacingTokens;
}

// ============================================================================
// SPACING TOKENS
// ============================================================================

export interface SpacingTokens {
  /** Base unit in pixels (default: 4) */
  unit: number;
  /** Named spacing scale */
  scale: {
    none: number; // 0
    xs: number; // 4px (1 unit)
    sm: number; // 8px (2 units)
    md: number; // 16px (4 units)
    lg: number; // 24px (6 units)
    xl: number; // 32px (8 units)
    "2xl": number; // 48px (12 units)
    "3xl": number; // 64px (16 units)
  };
  /** Container max widths */
  container: {
    sm: string; // 640px
    md: string; // 768px
    lg: string; // 1024px
    xl: string; // 1280px
    full: string; // 100%
  };
}

// ============================================================================
// MOTION TOKENS (expanded)
// ============================================================================

export interface MotionTokens {
  duration: {
    instant: number; // 0ms - no animation
    fast: number; // 100ms - micro interactions
    short: number; // 150ms - subtle feedback
    medium: number; // 250ms - standard transitions
    long: number; // 400ms - complex animations
    slower: number; // 600ms - entrance/exit
  };
  easing: {
    /** Standard easing for most transitions */
    standard: string;
    /** Emphasized easing for important state changes */
    emphasized: string;
    /** Decelerate for entering elements */
    decelerate: string;
    /** Accelerate for exiting elements */
    accelerate: string;
    /** Linear for progress indicators */
    linear: string;
    /** Bounce effect for playful interactions */
    bounce?: string;
    /** Elastic for spring-like animations */
    elastic?: string;
  };
  /** Enable/disable motion globally (for reduced-motion preference) */
  reducedMotion?: boolean;
}

// ============================================================================
// EFFECTS TOKENS (expanded)
// ============================================================================

export interface ElevationTokens {
  none: string;
  level1: string; // subtle shadow for cards
  level2: string; // medium shadow for dropdowns
  level3: string; // strong shadow for modals
  level4: string; // very strong shadow
  level5: string; // maximum elevation
}

export interface BorderTokens {
  /** Border widths */
  width: {
    none: number;
    thin: number; // 1px
    medium: number; // 2px
    thick: number; // 4px
  };
  /** Border styles */
  style: {
    solid: string;
    dashed: string;
    dotted: string;
  };
}

export interface EffectsTokens {
  elevation: ElevationTokens;
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
      link?: boolean;
    };
  };
  overlay: {
    backdropColor: string;
    opacity: number; // 0..1
  };
  borderRadius: {
    none: number; // 0
    sm: number; // in px (e.g., 2-4)
    md: number; // (e.g., 6-8)
    lg: number; // (e.g., 12-16)
    xl: number; // (e.g., 20-24)
    full: number; // 9999 for pills/circles
  };
  border: BorderTokens;
  /** Glass/blur effect for surfaces */
  glass?: {
    blur: number; // backdrop-filter blur in px
    opacity: number; // background opacity 0..1
    saturation?: number; // backdrop-filter saturate (1 = normal)
  };
}

// ============================================================================
// INTERACTION TOKENS (expanded)
// ============================================================================

export interface InteractionTokens {
  hoverOpacity: number; // 0..1 applied to hover state
  activeOpacity: number; // 0..1 applied to active/pressed state
  disabledOpacity: number; // 0..1 for disabled elements
  hoverOverlay?: string; // rgba overlay color for hover backgrounds
  activeOverlay?: string; // rgba overlay color for active backgrounds
  hoverElevationScale?: number; // scales shadow alpha on hover
  activeElevationScale?: number; // scales shadow alpha on active
  hoverGlow?: boolean; // enable glow on hover regardless of base appliesTo.button
  activeGlow?: boolean; // enable glow on active
  pressTransform?: string; // e.g., 'scale(0.98)' for press feedback
  /** Hover scale transform */
  hoverScale?: string; // e.g., 'scale(1.02)' for hover grow effect
  /** Transition timing for interactive states */
  transitionDuration?: number; // ms
}

// ============================================================================
// INPUT TOKENS (expanded)
// ============================================================================

export interface InputTokens {
  bg: string; // background color for inputs
  bgFocus?: string; // background when focused
  bgDisabled?: string; // background when disabled
  border: string; // default border color
  borderFocus?: string; // border when focused
  borderError?: string; // border on error state
  borderSuccess?: string; // border on success state
  text?: string; // input text color
  placeholder?: string; // placeholder text color
  /** Input sizes */
  size?: {
    sm: { height: number; padding: string; fontSize: string };
    md: { height: number; padding: string; fontSize: string };
    lg: { height: number; padding: string; fontSize: string };
  };
}

// ============================================================================
// COMPONENT TOKENS
// ============================================================================

export interface ButtonTokens {
  /** Default button variant styles */
  variants?: {
    primary?: {
      bg: string;
      color: string;
      hoverBg?: string;
      activeBg?: string;
    };
    secondary?: {
      bg: string;
      color: string;
      hoverBg?: string;
      activeBg?: string;
    };
    outlined?: {
      borderColor: string;
      color: string;
      hoverBg?: string;
    };
    ghost?: {
      color: string;
      hoverBg?: string;
    };
  };
  /** Button sizes */
  size?: {
    sm: { height: number; padding: string; fontSize: string };
    md: { height: number; padding: string; fontSize: string };
    lg: { height: number; padding: string; fontSize: string };
  };
  /** Border radius override for buttons */
  borderRadius?: number;
  /** Font weight for button text */
  fontWeight?: number;
  /** Letter spacing for button text */
  letterSpacing?: string;
  /** Text transform */
  textTransform?: "none" | "uppercase" | "capitalize";
}

export interface CardTokens {
  bg?: string;
  border?: string;
  borderRadius?: number;
  padding?: string;
  shadow?: string;
  hoverShadow?: string;
  /** Card variants */
  variants?: {
    elevated?: { shadow: string };
    outlined?: { borderColor: string };
    filled?: { bg: string };
  };
}

export interface ChipTokens {
  borderRadius?: number;
  fontSize?: string;
  height?: {
    sm: number;
    md: number;
    lg: number;
  };
}

export interface AvatarTokens {
  size?: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  borderRadius?: number;
  border?: string;
}

export interface SkeletonTokens {
  /** Base background color for skeleton */
  bg?: string;
  /** Highlight/shimmer color for animation */
  highlight?: string;
  /** Animation duration in ms */
  animationDuration?: number;
  /** Border radius for skeleton items */
  borderRadius?: number;
}

export interface TableTokens {
  /** Header background color */
  headerBg?: string;
  /** Header text color */
  headerColor?: string;
  /** Row hover background color */
  rowHoverBg?: string;
  /** Striped row background color (even rows) */
  stripedBg?: string;
  /** Border color between rows */
  borderColor?: string;
  /** Cell padding */
  cellPadding?: string;
}

export interface BadgeTokens {
  /** Badge sizes */
  size?: {
    sm: number;
    md: number;
    lg: number;
  };
  /** Font size */
  fontSize?: string;
  /** Border radius */
  borderRadius?: number;
}

export interface GradientAnimationTokens {
  /** Start color for the base gradient (CSS color like "rgb(15, 23, 42)") */
  gradientBackgroundStart: string;
  /** End color for the base gradient (CSS color) */
  gradientBackgroundEnd: string;
  /** First orb color (RGB values like "99, 102, 241") */
  firstColor: string;
  /** Second orb color (RGB values) */
  secondColor: string;
  /** Third orb color (RGB values) */
  thirdColor: string;
  /** Fourth orb color (RGB values) */
  fourthColor: string;
  /** Fifth orb color (RGB values) */
  fifthColor: string;
  /** Interactive pointer orb color (RGB values) */
  pointerColor: string;
}

export interface ComponentTokens {
  button?: ButtonTokens;
  card?: CardTokens;
  chip?: ChipTokens;
  avatar?: AvatarTokens;
  skeleton?: SkeletonTokens;
  table?: TableTokens;
  badge?: BadgeTokens;
  /** Gradient animation background colors */
  gradientAnimation?: GradientAnimationTokens;
}

// ============================================================================
// PALETTE TOKENS (expanded)
// ============================================================================

export interface NeutralColorScale {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
}

export interface TextColorTokens {
  primary: string; // Main text color
  secondary: string; // Subdued text
  tertiary: string; // Even more subdued
  disabled: string; // Disabled state
  inverse: string; // Text on dark/light backgrounds
  link: string; // Link color
  linkHover: string; // Link hover color
}

export interface PaletteTokens {
  // Core brand colors
  primary: string;
  onPrimary: string;
  primaryLight?: string; // lighter variant
  primaryDark?: string; // darker variant

  secondary: string;
  onSecondary: string;
  secondaryLight?: string;
  secondaryDark?: string;

  tertiary: string;
  onTertiary: string;

  // Info color (often blue, distinct from primary)
  info?: string;
  onInfo?: string;

  // Backgrounds
  background: string;
  onBackground: string;
  backgroundAlt?: string; // Alternative background (e.g., for sections)

  surface: string; // cards/surfaces background
  onSurface: string; // default text on surfaces
  surfaceAlt?: string; // Alternative surface (e.g., for nested cards)

  // Semantic colors
  error: string;
  onError: string;
  errorLight?: string;

  warning: string;
  onWarning: string;
  warningLight?: string;

  success: string;
  onSuccess: string;
  successLight?: string;

  // Dividers and borders
  divider: string;
  border?: string; // General border color

  // Text colors (optional, can derive from on* colors)
  text?: TextColorTokens;

  // Neutral scale (grays)
  neutral?: NeutralColorScale;

  // Gradients
  gradientPrimary?: string;
  gradientSecondary?: string;
  gradientAccent?: string;
  gradientBackground?: string; // subtle page background gradient

  /** App navigation bar styling (glassy header) */
  appBar?: {
    bg: string;
    color?: string;
    border?: string;
    glassOpacity?: number;
    blur?: number;
  };

  /** Sidebar styling */
  sidebar?: {
    bg: string;
    color?: string;
    border?: string;
    activeItemBg?: string;
    hoverItemBg?: string;
  };

  /** Footer styling */
  footer?: {
    bg: string;
    color?: string;
    border?: string;
  };
}

// ============================================================================
// BASE TOKENS (complete definition)
// ============================================================================

export interface BaseTokens {
  mode: ThemeMode;
  /** Color palette */
  palette: PaletteTokens;
  /** Visual effects (shadows, borders, glows) */
  effects: EffectsTokens;
  /** Animation and transitions */
  motion: MotionTokens;
  /** Interactive states */
  interaction?: InteractionTokens;
  /** Input field styling */
  input?: InputTokens;
  /** Typography settings */
  typography?: TypographyTokens;
  /** Spacing scale */
  spacing?: SpacingTokens;
  /** Component-specific tokens */
  components?: ComponentTokens;
}

export type DesignTokens = BaseTokens;
