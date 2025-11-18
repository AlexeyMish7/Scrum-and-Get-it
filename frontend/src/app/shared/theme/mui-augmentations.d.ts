/**
 * MUI Module Augmentations
 *
 * Extends MUI TypeScript types for custom theme features:
 * - Custom button/loading button variants
 * - Tertiary palette color
 * - Design tokens in theme object
 */

import "@mui/material/styles";
import type { DesignTokens } from "./types";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Theme Object Extensions
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

declare module "@mui/material/styles" {
  interface Theme {
    designTokens: DesignTokens; // Custom design tokens attached to theme
  }
  interface ThemeOptions {
    designTokens?: Partial<DesignTokens>;
  }

  // Custom tertiary color in palette
  interface Palette {
    tertiary: Palette["primary"];
  }
  interface PaletteOptions {
    tertiary?: PaletteOptions["primary"];
  }

  interface Components {
    MuiLoadingButton?: unknown; // Allow theme.components.MuiLoadingButton overrides
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Custom Button Variants
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TODO: These variants are declared but not implemented in factory.ts
// Either implement them or remove these declarations to avoid confusion.
// Currently unused in codebase (verified via grep).

declare module "@mui/material/Button" {
  interface ButtonPropsVariantOverrides {
    primary: true;
    secondary: true;
    tertiary: true;
    destructive: true;
    glass: true;
    glow: true;
  }
}

declare module "@mui/lab/LoadingButton" {
  interface LoadingButtonPropsVariantOverrides {
    primary: true;
    secondary: true;
    tertiary: true;
    destructive: true;
    glass: true;
    glow: true;
  }
}
