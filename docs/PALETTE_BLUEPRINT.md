# Palette Blueprint and Theme Customization

This document shows the complete palette/token shape our theme system expects and how to create your own theme from a palette. Copy the examples below as a starting point.

## Overview

- You define design tokens in a palette file (colors, radii, elevation, glow, input styling, interactions, navbar look).
- The theme factory (`factory.ts`) converts those tokens into an MUI Theme and component overrides.
- Two palettes ship by default:
  - `palettes/lightPalette.ts`
  - `palettes/darkPalette.ts`
- Theme instances are created in `lightTheme.tsx` and `darkTheme.tsx`.

## Token Shape (Blueprint)

The token interfaces live in `types.ts`. Practical blueprint (with inline comments):

```ts
import type { BaseTokens } from "./types";

const myPaletteTokens: BaseTokens = {
  mode: "light", // or "dark"
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

    divider: "rgba(148,163,184,0.2)",

    // Optional accents
    gradientPrimary: "linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)",
    gradientAccent: "linear-gradient(135deg, #6366f1 0%, #3b82f6 50%, #06b6d4 100%)",

    // Navbar config (glassy header)
    appBar: {
      bg: "#ffffff",             // base color for the header
      color: "#0f172a",          // text/icon color in the header
      border: "rgba(148,163,184,0.2)",
      glassOpacity: 0.8,          // background alpha
      blur: 16,                   // backdrop blur in px
    },
  },

  effects: {
    elevation: {
      level1: "0 8px 32px rgba(16,24,40,0.08)",
      level2: "0 12px 40px rgba(16,24,40,0.12)",
      level3: "0 16px 64px rgba(16,24,40,0.10)",
      level4: "0 2px 8px rgba(16,24,40,0.10)",
      level5: "0 0 0 4px rgba(59,130,246,0.2)",
    },
    depth: "subtle", // flat | subtle | normal | strong

    focusRing: { color: "rgba(59,130,246,0.35)", width: 3, offset: 2 },

    glow: {
      color: "rgba(59,130,246,0.30)",
      spread: "0 0 10px",
      strength: 1, // reserved for future scaling in factory
      appliesTo: {
        button: true,
        card: false,
        paper: false,
        inputFocus: true,
      },
    },

    // Global corners (px). Tiny defaults are recommended. These flow to components.
    borderRadius: { sm: 2, md: 4, lg: 6, xl: 8, pill: 999 },

    overlay: { backdropColor: "rgba(16,24,40,0.1)", opacity: 1 },
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

  // Interaction state tuning (hover/active)
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

  // Input visuals (better dark-mode contrast)
  input: {
    bg: "rgba(0,0,0,0.03)",
    border: "rgba(0,0,0,0.08)",
  },
};

export default myPaletteTokens;
```

## Line-by-line reference (what each setting affects)

Below is a concise reference for every token shown in the blueprint object above. Unless noted, values are strings. Suggested ranges are guidelines you can adjust for your brand.

- mode: "light" | "dark"
  - Affects: Base palette mode. MUI components and some defaults adjust automatically. Also used for contrast behavior in the factory.
  - Range: exactly "light" or "dark".

- palette.primary
  - Affects: Primary color used in buttons, selected states, links, focus accents.
  - Range: any CSS color; prefer hex like #3b82f6.
- palette.onPrimary
  - Affects: Foreground color (text/icons) placed on top of primary backgrounds.
  - Range: any CSS color; usually high contrast (white on dark brand, dark on light brand).

- palette.secondary / palette.onSecondary
  - Affects: Secondary action color and its foreground. Used for less-prominent CTAs/accents.
  - Range: any CSS colors.

- palette.tertiary / palette.onTertiary
  - Affects: Optional tertiary accent scale used in custom components or charts.
  - Range: any CSS colors.

- palette.background / palette.onBackground
  - Affects: Page background and default text on the page.
  - Range: any CSS colors. For dark mode keep background near-opaque for readability.

- palette.surface / palette.onSurface
  - Affects: Paper/Card surfaces and their default text color.
  - Range: any CSS colors. For dark mode surfaces, keep alpha high (e.g., rgba(..., 0.9–0.98)).

- palette.error / palette.onError
  - Affects: Error states (alerts, error buttons) and the text color on error backgrounds.
  - Range: any CSS colors (reds commonly #ef4444..#dc2626).

- palette.warning / palette.onWarning
  - Affects: Warning states and foreground on warning backgrounds.
  - Range: any CSS colors (ambers/yellows like #f59e0b).

- palette.success / palette.onSuccess
  - Affects: Success states and foreground on success backgrounds.
  - Range: any CSS colors (greens like #10b981).

- palette.divider
  - Affects: Borders, separators, and outlines.
  - Range: any CSS color; semi-transparent rgba recommended (e.g., 0.12–0.24 alpha).

- palette.gradientPrimary / palette.gradientAccent (optional)
  - Affects: Optional gradient values for hero elements or custom components.
  - Range: any valid CSS gradient string.

- palette.appBar.bg
  - Affects: Navbar base color (glassy header background before opacity/blur).
  - Range: any CSS color.
- palette.appBar.color
  - Affects: Navbar text/icon color.
  - Range: any CSS color; keep high contrast vs bg.
- palette.appBar.border
  - Affects: Bottom border/line under the navbar.
  - Range: any CSS color; semi-transparent recommended.
- palette.appBar.glassOpacity
  - Affects: Alpha applied to the navbar background for the glass effect.
  - Range: 0..1 (typical 0.7–0.9).
- palette.appBar.blur
  - Affects: Backdrop blur strength in pixels.
  - Range: integer pixels (typical 8–24).

- effects.elevation.level1..level5
  - Affects: Box-shadow presets used for surfaces and interactive states.
  - Range: CSS box-shadow strings. Use rgba(...) with modest alpha (e.g., 0.06–0.24). Level increases should imply greater depth.

- effects.depth
  - Affects: Global scaling of shadow intensity across the app.
  - Range: "flat" (no shadow), "subtle" (reduced alpha), "normal" (as-is), "strong" (slightly boosted alpha).

- effects.focusRing.color / width / offset / style
  - Affects: Keyboard focus visibility outline on inputs/buttons.
  - Range:
    - color: any CSS color; semi-transparent brand tint recommended.
    - width: px (typical 2–4).
    - offset: px (optional, typical 0–3).
    - style: "solid" | "dashed" (optional).

- effects.glow.color / spread / strength / appliesTo
  - Affects: Soft outer glow layered on top of elevation; used for highlights.
  - Range:
    - color: rgba with low alpha (e.g., 0.2–0.4).
    - spread: CSS shadow offsets (e.g., "0 0 10px"). Larger blur = softer glow.
    - strength: number (reserved for future scaling; keep 1).
    - appliesTo: booleans per component { button, card, paper, inputFocus }.

- effects.borderRadius.sm / md / lg / xl / pill
  - Affects: Global corner radii used by inputs, buttons, cards, etc.
  - Range: px integers. Recommended tiny radii: 2, 4, 6, 8; pill ~999.

- effects.overlay.backdropColor / opacity
  - Affects: Backdrop color for modal overlays.
  - Range: color any CSS; opacity 0..1 (typical 0.6–0.95 for dark overlays; here tokens use 1 for full color application with RGBA alpha inside).

- motion.duration.short / medium / long
  - Affects: Animation/transition timing used in hover/active/focus.
  - Range: milliseconds (typical short 120–160, medium 200–260, long 300–400).

- motion.easing.standard / emphasized / decelerate / accelerate
  - Affects: Timing function for transitions.
  - Range: any CSS cubic-bezier string. Use Material-like curves for consistency.

- interaction.hoverOpacity / activeOpacity
  - Affects: MUI palette.action hover/activated opacity fallback. Kept for compatibility.
  - Range: 0..1 (typical 0.04–0.16). Note: The factory primarily uses overlay colors below.

- interaction.hoverOverlay / activeOverlay
  - Affects: Semi-transparent background tint applied to buttons on hover/press.
  - Range: rgba strings. Suggested alpha: 0.04–0.12 depending on mode.

- interaction.hoverElevationScale / activeElevationScale
  - Affects: Shadow intensity multiplier on hover/active states.
  - Range: numbers ~1.0–1.35 (hover often ~1.05–1.15, active ~1.15–1.3).

- interaction.hoverGlow / activeGlow
  - Affects: Enables glow on hover/active even if not enabled by base appliesTo.
  - Range: boolean.

- interaction.pressTransform
  - Affects: Button transform on press for tactile feedback.
  - Range: CSS transform string; typical is "scale(0.98–0.995)".

- input.bg / input.border
  - Affects: Default input (Outlined/Filled) background and border colors.
  - Range: any CSS colors. For dark mode, bg alpha ~0.06–0.14, border alpha ~0.12–0.24 recommended.

## Creating a New Theme

1) Create a new palette file
- Copy `palettes/lightPalette.ts` to `palettes/myBrandPalette.ts`
- Adjust tokens as needed (colors, appBar, depth, glow, interaction, radii)

2) Create a theme from your palette
- Quick test: temporarily import your palette into `lightTheme.tsx` or `darkTheme.tsx`:
```ts
import { responsiveFontSizes } from "@mui/material/styles";
import createThemeFromTokens from "./factory";
import myPalette from "./palettes/myBrandPalette";

let theme = createThemeFromTokens(myPalette);
theme = responsiveFontSizes(theme);
export default theme;
```

- Or create `myTheme.tsx` next to `lightTheme.tsx` and export from there.

3) Wire into the app (optional)
- `ThemeContext.tsx` currently toggles between `lightTheme` and `darkTheme`.
- To add your theme, you can:
  - Replace one of the themes for testing, or
  - Extend `ThemeContext` to support more modes (e.g., "myBrand").

## What Each Token Controls (Cheat Sheet)

- palette.primary/secondary/tertiary: MUI color scales (used in buttons, links, etc.).
- palette.background/surface: page and paper/card backgrounds.
- palette.on* tokens: text color on top of the related background.
- palette.appBar: navbar background, blur, opacity, and text color.
- effects.elevation + effects.depth: box-shadow strings and their global intensity.
- effects.glow: soft glow applied to selected components.
- effects.borderRadius: global corner radii (used by Paper/Card/Button/Input overrides).
- motion.duration/easing: transitions for hover/active states.
- interaction.*: hover/active overlays, elevation increase, glow toggles, and press transform.
- input.bg/border: default input backgrounds/borders (Outlined/Filled inputs).

## Tips

- Keep dark theme surfaces near-opaque to avoid readability issues.
- Favor tiny radii (2/4/6/8px) for a sharper look.
- Keep glow subtle; adjust alpha in `glow.color` to avoid noisy UI.
- Adjust appBar glassiness with `glassOpacity` and `blur`.
