# Shared Theme System

**Location**: `src/app/shared/theme/`
**Purpose**: Global theming infrastructure using design tokens and MUI theme customization
**Lines of Code**: ~935 lines across 9 files
**Last Updated**: November 2025

---

## 📚 Table of Contents

1. [Overview](#overview)
2. [File Structure](#file-structure)
3. [Architecture](#architecture)
4. [Design Token System](#design-token-system)
5. [Theme Factory](#theme-factory)
6. [Usage Patterns](#usage-patterns)
7. [MUI Type Augmentations](#mui-type-augmentations)
8. [CSS Custom Properties](#css-custom-properties)
9. [Common Pitfalls](#common-pitfalls)
10. [Future Improvements](#future-improvements)

---

## Overview

The theme system provides a **design token-based** approach to theming with:

- **Two global themes**: `lightTheme` and `darkTheme` (not workspace-specific)
- **Design tokens**: Structured color, spacing, effect, motion, and interaction tokens
- **MUI integration**: Converts design tokens to MUI theme structure
- **CSS variables**: Exports tokens as CSS custom properties for non-MUI areas
- **Type safety**: Full TypeScript support with MUI module augmentation

**Key Principle**: Design tokens are the single source of truth. The factory transforms them into MUI-compatible themes.

---

## File Structure

```
src/app/shared/theme/
├── index.ts                    # Barrel export (11 lines)
├── types.ts                    # Design token interfaces (350 lines)
├── factory.ts                  # Theme creation logic (334 lines)
├── lightTheme.tsx              # Light theme instance (7 lines)
├── darkTheme.tsx               # Dark theme instance (7 lines)
├── exportCssVars.ts            # CSS custom properties export (30 lines)
├── mui-augmentations.d.ts      # MUI type extensions (65 lines)
└── palettes/
    ├── lightPalette.ts         # Light design tokens (71 lines)
    └── darkPalette.ts          # Dark design tokens (76 lines)
```

**Total**: 9 files, ~935 lines of code

---

## Architecture

### Flow Diagram

```
┌─────────────────────┐
│  Design Tokens      │  (lightPalette.ts / darkPalette.ts)
│  (BaseTokens)       │  - Palette colors
└──────────┬──────────┘  - Effect styles (shadows, glows, borders)
           │             - Motion timing
           │             - Interaction states
           ↓             - Input styles
┌─────────────────────┐
│  Theme Factory      │  (factory.ts)
│  createThemeFromTokens
└──────────┬──────────┘  Converts tokens → MUI Theme structure
           │
           ↓
┌─────────────────────┐
│  MUI Theme          │  (lightTheme.tsx / darkTheme.tsx)
│  + designTokens     │  Instances ready for ThemeProvider
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│  ThemeContext       │  (shared/context/ThemeContext.tsx)
│  ThemeProvider      │  Global provider with mode toggle
└─────────────────────┘
```

### Component Relationships

- **`types.ts`**: Defines TypeScript interfaces for design tokens
- **`palettes/`**: Concrete token values for light/dark modes
- **`factory.ts`**: Converts tokens to MUI `Theme` objects
- **`lightTheme.tsx` / `darkTheme.tsx`**: Instantiate themes by calling factory with respective palettes
- **`mui-augmentations.d.ts`**: Extends MUI types for custom properties (tertiary color, designTokens, custom button variants)
- **`exportCssVars.ts`**: Generates CSS custom properties from tokens for non-MUI areas
- **`index.ts`**: Re-exports themes, types, utilities for easy imports

---

## Design Token System

### Token Structure

Design tokens are organized into specialized categories:

```typescript
interface BaseTokens {
  palette: PaletteTokens; // Colors (primary, secondary, tertiary, etc.)
  effects: EffectsTokens; // Shadows, glows, borders, focus rings
  motion: MotionTokens; // Animation durations and easings
  interaction: InteractionTokens; // Hover/active/focus states
  input: InputTokens; // Form input specific tokens
}
```

### Example Token Usage

```typescript
// palettes/lightPalette.ts
export const lightPalette: BaseTokens = {
  palette: {
    primary: { main: "#1976d2", light: "#42a5f5", dark: "#1565c0" },
    secondary: { main: "#9c27b0", light: "#ba68c8", dark: "#7b1fa2" },
    tertiary: { main: "#00796b", light: "#48a999", dark: "#004d40" },
    // ...
  },
  effects: {
    shadow: { small: "0 2px 4px rgba(0,0,0,0.1)" /* ... */ },
    glow: { color: "rgba(25, 118, 210, 0.4)", spread: "0 0 20px" /* ... */ },
    // ...
  },
  // ...
};
```

### Token Categories

#### 1. **PaletteTokens**

Core colors for UI elements:

- `primary`, `secondary`, `tertiary`: Main brand colors
- `background`, `surface`, `paper`: Layout backgrounds
- `text`: Text color hierarchy (primary, secondary, disabled)
- `border`: Border colors (default, light, focus, error)
- `success`, `warning`, `error`, `info`: Semantic colors

#### 2. **EffectsTokens**

Visual effects and depth:

- `shadow`: Elevation shadows (small, medium, large)
- `glow`: Glow effects for focus/hover states
- `border`: Border styles and radii
- `focusRing`: Keyboard focus indicators
- `glass`: Glassmorphism effects (backdrop blur, opacity)

#### 3. **MotionTokens**

Animation and transitions:

- `duration`: Timing constants (fast, normal, slow)
- `easing`: Cubic-bezier curves (standard, decelerate, sharp)

#### 4. **InteractionTokens**

Interactive state modifiers:

- `hover`, `active`, `focus`: Opacity and glow toggles
- `disabled`: Disabled state appearance

#### 5. **InputTokens**

Form input styling:

- `borderRadius`, `borderWidth`, `borderColor`
- `focusBorderColor`, `errorBorderColor`
- `backgroundColor`, `disabledBackgroundColor`

---

## Theme Factory

### `createThemeFromTokens(tokens: BaseTokens): Theme`

**File**: `factory.ts`
**Purpose**: Transforms design tokens into a MUI-compatible `Theme` object

**Process**:

1. Maps token colors to MUI palette structure
2. Converts effect tokens to MUI shadows and component overrides
3. Applies motion tokens to transition durations
4. Configures component defaults (Button, Card, TextField, etc.)
5. Attaches original tokens to `theme.designTokens` for direct access

### Factory Highlights

```typescript
const theme = createMuiTheme({
  palette: {
    mode: tokens.palette.background.default === "#121212" ? "dark" : "light",
    primary: { main: tokens.palette.primary.main /* ... */ },
    secondary: { main: tokens.palette.secondary.main /* ... */ },
    tertiary: { main: tokens.palette.tertiary.main /* ... */ }, // Custom!
    // ...
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: tokens.effects.border.radius.medium,
          transition: `all ${tokens.motion.duration.fast}ms ${tokens.motion.easing.standard}`,
          // ...
        },
      },
    },
    // ... (Card, TextField, Chip, etc.)
  },
  // ...
});

// Attach original tokens
theme.designTokens = tokens;
```

**Why attach tokens?**
MUI theme doesn't natively support all token types (e.g., `glow`, `glass`). By attaching tokens, components can access them:

```tsx
const theme = useTheme();
const glowColor = theme.designTokens.effects.glow.color; // Direct access
```

---

## Usage Patterns

### 1. Global Theme (Most Common)

Themes are applied globally via `ThemeContext`:

```tsx
// src/main.tsx
import { ThemeContextProvider } from "@shared/context/ThemeContext";

<ThemeContextProvider>
  <App />
</ThemeContextProvider>;
```

**Theme toggle**:

```tsx
const { mode, toggleTheme } = useThemeContext();

<Button onClick={toggleTheme}>
  {mode === "light" ? "Dark Mode" : "Light Mode"}
</Button>;
```

### 2. Accessing Theme in Components

```tsx
import { useTheme } from "@mui/material/styles";

function MyComponent() {
  const theme = useTheme();

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.primary.main,
        boxShadow: theme.designTokens.effects.shadow.medium,
        borderRadius: theme.designTokens.effects.border.radius.large,
      }}
    >
      Content
    </Box>
  );
}
```

### 3. Using MUI Palette

MUI components automatically use theme colors:

```tsx
<Button color="primary" variant="contained">Primary</Button>
<Button color="secondary" variant="outlined">Secondary</Button>
<Button color="tertiary" variant="text">Tertiary</Button> {/* Custom color! */}
```

### 4. Custom Styles with Design Tokens

For non-MUI areas or advanced effects:

```tsx
const theme = useTheme();

<div
  style={{
    background: theme.designTokens.effects.glass.background,
    backdropFilter: theme.designTokens.effects.glass.backdrop,
    border: `1px solid ${theme.palette.border.default}`,
  }}
>
  Glassmorphic Card
</div>;
```

### 5. CSS Custom Properties (Non-React)

Use `exportCssVars` for CSS-only styling:

```tsx
import { exportCssVars } from "@shared/theme";

// In a global CSS file or <style> tag:
const cssVars = exportCssVars(lightPalette);
// Output: { '--color-primary': '#1976d2', '--shadow-small': '...', ... }
```

---

## MUI Type Augmentations

**File**: `mui-augmentations.d.ts`

### What It Does

Extends MUI's TypeScript definitions to support custom theme properties:

```typescript
declare module "@mui/material/styles" {
  interface Theme {
    designTokens: DesignTokens; // ← Attach tokens to theme
  }

  interface Palette {
    tertiary: Palette["primary"]; // ← Add tertiary color
  }
}
```

### Custom Button Variants (Declared but Not Implemented)

```typescript
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
```

**⚠️ Important**: These variants are **declared** but **not implemented** in `factory.ts`.
**Usage**: Currently unused. Either implement in factory or remove declarations.

### Why Augment?

Without augmentation, TypeScript would error on:

```tsx
const color = theme.palette.tertiary.main; // ❌ Error: Property 'tertiary' does not exist
const glow = theme.designTokens.effects.glow; // ❌ Error: Property 'designTokens' does not exist
```

With augmentation:

```tsx
const color = theme.palette.tertiary.main; // ✅ Works!
const glow = theme.designTokens.effects.glow; // ✅ Works!
```

---

## CSS Custom Properties

**File**: `exportCssVars.ts`

### Purpose

Generates CSS custom properties from design tokens for use in:

- Plain CSS files
- Styled components
- Third-party libraries (non-MUI)

### Example

```typescript
import { exportCssVars } from "@shared/theme";
import { lightPalette } from "@shared/theme/palettes/lightPalette";

const cssVars = exportCssVars(lightPalette);
// Output:
// {
//   '--color-primary': '#1976d2',
//   '--color-secondary': '#9c27b0',
//   '--shadow-small': '0 2px 4px rgba(0,0,0,0.1)',
//   '--border-radius-medium': '8px',
//   ...
// }

// Apply to :root
Object.entries(cssVars).forEach(([key, value]) => {
  document.documentElement.style.setProperty(key, value);
});
```

### Usage in CSS

```css
.custom-card {
  background-color: var(--color-surface);
  box-shadow: var(--shadow-medium);
  border-radius: var(--border-radius-large);
}
```

---

## Common Pitfalls

### ❌ Don't: Hardcode Colors

```tsx
// Bad
<Box sx={{ backgroundColor: "#1976d2" }} />
```

### ✅ Do: Use Theme Palette

```tsx
// Good
<Box sx={{ backgroundColor: "primary.main" }} />
// or
<Box sx={{ backgroundColor: theme => theme.palette.primary.main }} />
```

---

### ❌ Don't: Modify Theme Directly

```tsx
// Bad - mutates shared object
theme.palette.primary.main = "#ff0000";
```

### ✅ Do: Create New Theme Instance

```tsx
// Good - create new theme with custom tokens
const customTokens = {
  ...lightPalette,
  palette: { ...lightPalette.palette, primary: { main: "#ff0000" } },
};
const customTheme = createThemeFromTokens(customTokens);
```

---

### ❌ Don't: Use Undeclared Variants

```tsx
// Bad - variant declared but not implemented
<Button variant="glass">Click Me</Button> // No styling applied!
```

### ✅ Do: Use Standard Variants or Implement Custom

```tsx
// Good - use standard MUI variants
<Button variant="contained">Click Me</Button>

// Or implement custom variant in factory.ts first
```

---

### ❌ Don't: Forget Type Augmentations

```tsx
// Bad - TypeScript error without augmentation
const tertiary = theme.palette.tertiary.main;
```

### ✅ Do: Import Augmentations

```tsx
// Good - augmentations auto-imported via barrel export
import { lightTheme } from "@shared/theme";
const tertiary = lightTheme.palette.tertiary.main; // ✅ Works!
```

---

## Future Improvements

### 1. Implement Custom Button Variants

Currently declared in `mui-augmentations.d.ts` but not implemented in `factory.ts`:

```typescript
// TODO: Add to factory.ts
MuiButton: {
  variants: [
    {
      props: { variant: "glass" },
      style: (theme) => ({
        background: theme.designTokens.effects.glass.background,
        backdropFilter: theme.designTokens.effects.glass.backdrop,
        border: `1px solid ${theme.palette.border.light}`,
      }),
    },
    {
      props: { variant: "glow" },
      style: (theme) => ({
        boxShadow: `${theme.designTokens.effects.glow.spread} ${theme.designTokens.effects.glow.color}`,
      }),
    },
    // ... (destructive, tertiary, etc.)
  ],
}
```

**Benefit**: Enables `<Button variant="glass">` with proper styling.

---

### 2. Dynamic Radius Mode

Current implementation has a "radius mode" toggle in `ThemeContext` but it's not fully integrated into tokens:

```typescript
// TODO: Add radius mode to tokens
interface EffectsTokens {
  border: {
    radius: {
      mode: "sharp" | "rounded"; // ← Add this
      small: string; // Adjust based on mode
      medium: string;
      large: string;
    };
  };
}
```

---

### 3. Color Contrast Validation

Add runtime checks for WCAG AA/AAA compliance:

```typescript
// TODO: Add contrast checker
function validateContrast(fg: string, bg: string): boolean {
  const ratio = calculateContrastRatio(fg, bg);
  return ratio >= 4.5; // WCAG AA
}
```

---

### 4. Theme Preset Library

Create pre-built theme presets for common use cases:

```typescript
// TODO: Add presets
export const themePresets = {
  professional: {
    /* conservative colors, minimal effects */
  },
  creative: {
    /* vibrant colors, glass effects */
  },
  accessible: {
    /* high contrast, large text */
  },
};
```

---

### 5. Remove Unused Variant Declarations

If custom button variants won't be implemented soon, remove declarations to avoid confusion:

```typescript
// Option 1: Remove from mui-augmentations.d.ts
// Option 2: Implement in factory.ts
```

---

## Summary

| Aspect               | Details                                                    |
| -------------------- | ---------------------------------------------------------- |
| **Files**            | 9 files, ~935 lines                                        |
| **Themes**           | `lightTheme`, `darkTheme` (global, not workspace-specific) |
| **Token Categories** | Palette, Effects, Motion, Interaction, Input               |
| **MUI Integration**  | `createThemeFromTokens` factory                            |
| **Type Safety**      | Full TypeScript with MUI augmentations                     |
| **CSS Export**       | `exportCssVars` for CSS custom properties                  |
| **Global Provider**  | `ThemeContext` with mode toggle                            |
| **Custom Features**  | Tertiary color, designTokens on theme                      |
| **Status**           | Production-ready, minor TODOs (custom variants)            |

---

## Quick Reference

```tsx
// Import theme
import { lightTheme, darkTheme } from "@shared/theme";

// Use in component
const theme = useTheme();
const primaryColor = theme.palette.primary.main;
const shadowMedium = theme.designTokens.effects.shadow.medium;

// Toggle theme
const { mode, toggleTheme } = useThemeContext();
toggleTheme(); // Switch between light/dark

// Export CSS vars
import { exportCssVars } from "@shared/theme";
const cssVars = exportCssVars(lightPalette);
```

---

**Last Updated**: November 2025
**Maintainer**: ATS Tracker Team
**Status**: ✅ Production-ready
