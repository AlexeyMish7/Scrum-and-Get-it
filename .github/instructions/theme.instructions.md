# Theme System Instructions

> FlowATS theme system with separated color and design presets, theme composer, and comprehensive customization options.

---

## Location

```
frontend/src/app/shared/theme/
```

---

## Architecture Overview

The theme system separates **colors** from **design effects** for maximum flexibility:

```
Theme = Base Mode + Color Preset + Design Preset
        (light/dark)   (8 options)    (6 options)
```

**Example:** Light mode + Ocean Blue colors + Sleek Glass design

---

## Directory Structure

```
theme/
├── index.ts                    # Main exports
├── lightTheme.tsx              # Base light theme
├── darkTheme.tsx               # Base dark theme
├── types.ts                    # TypeScript definitions
├── composer.ts                 # NEW: Theme composition system
├── factory.ts                  # Theme factory functions
├── exportCssVars.ts            # CSS variable export
│
├── colorPresets/               # NEW: Color-only presets (8 total)
│   ├── index.ts
│   ├── oceanBlue.ts
│   ├── forestGreen.ts
│   ├── sunsetOrange.ts
│   ├── royalPurple.ts
│   ├── cherryRed.ts
│   ├── slateGray.ts
│   ├── amberGold.ts
│   └── midnightBlack.ts
│
├── designPresets/              # NEW: Design-only presets (6 total)
│   ├── index.ts
│   ├── default.ts              # Default design
│   ├── sleekGlass.ts           # Glass morphism
│   ├── boldBoxy.ts             # Sharp corners, high contrast
│   ├── softRounded.ts          # Rounded, soft shadows
│   ├── modernFlat.ts           # Flat design, no shadows
│   └── vibrantGradient.ts      # Gradient backgrounds
│
├── presets/                    # LEGACY: Combined presets
│   └── (kept for backwards compatibility)
│
├── palettes/
│   ├── lightPalette.ts         # Light mode color palette
│   └── darkPalette.ts          # Dark mode color palette
│
├── components/
│   ├── ColorPresetPicker.tsx   # Color preset selector UI
│   ├── DesignPresetPicker.tsx  # Design preset selector UI
│   └── ThemePreview.tsx        # Theme preview cards
│
├── hooks/
│   └── useAppTheme.ts          # Convenient token access hook
│
└── utils/
    ├── colorUtils.ts           # Color manipulation
    └── gradientUtils.ts        # Gradient helpers
```

---

## Theme Composition System

### The `composeTheme()` Function

Creates a theme by combining mode, color preset, and design preset:

```typescript
import { composeTheme } from "@shared/theme";

const theme = composeTheme({
  mode: "light", // 'light' | 'dark'
  colorPreset: "oceanBlue", // Color scheme
  designPreset: "sleekGlass", // Visual effects
});
```

**Returns:** A complete MUI theme object ready for `<ThemeProvider>`

---

## Color Presets

8 color schemes that define the app's color palette:

| Preset ID       | Description                    | Best For              |
| --------------- | ------------------------------ | --------------------- |
| `oceanBlue`     | Cool blues and teals (default) | Professional, calming |
| `forestGreen`   | Natural greens                 | Nature, growth        |
| `sunsetOrange`  | Warm oranges and yellows       | Energy, creativity    |
| `royalPurple`   | Deep purples                   | Luxury, elegance      |
| `cherryRed`     | Bold reds                      | Bold, passionate      |
| `slateGray`     | Neutral grays                  | Minimal, modern       |
| `amberGold`     | Rich golds                     | Warm, premium         |
| `midnightBlack` | High contrast darks            | Sleek, dramatic       |

**Structure:**

```typescript
export interface ColorPreset {
  id: ColorPresetId;
  name: string;
  description: string;
  paletteOverrides: {
    light: Partial<PaletteTokens>;
    dark: Partial<PaletteTokens>;
  };
}
```

**Usage:**

```typescript
import { oceanBlue, forestGreen } from "@shared/theme/colorPresets";

// Access preset definition
console.log(oceanBlue.name); // "Ocean Blue"
console.log(oceanBlue.paletteOverrides.light.primary);
```

---

## Design Presets

6 design systems that control shapes, shadows, and visual effects:

| Preset ID         | Radius | Shadow   | Borders | Glass Effect |
| ----------------- | ------ | -------- | ------- | ------------ |
| `default`         | Medium | Medium   | Subtle  | No           |
| `sleekGlass`      | Large  | Soft     | Light   | Yes          |
| `boldBoxy`        | None   | Strong   | Bold    | No           |
| `softRounded`     | XLarge | Diffused | None    | Slight       |
| `modernFlat`      | Medium | None     | None    | No           |
| `vibrantGradient` | Large  | Colored  | Glow    | Yes          |

**Structure:**

```typescript
export interface DesignPreset {
  id: DesignPresetId;
  name: string;
  description: string;
  effects: {
    borderRadius: string;
    shadowStrength: "none" | "light" | "medium" | "strong";
    glassMorphism: boolean;
  };
  // ... full effect overrides
}
```

---

## ThemeContext Integration

`ThemeContext` manages theme state and persistence:

```tsx
import { useTheme } from "@shared/context/ThemeContext";

function ThemeSettings() {
  const {
    mode,
    toggleMode,
    colorPreset,
    setColorPreset,
    designPreset,
    setDesignPreset,
  } = useTheme();

  return (
    <>
      <Button onClick={toggleMode}>
        {mode === "light" ? "Dark" : "Light"} Mode
      </Button>
      <ColorPresetPicker current={colorPreset} onChange={setColorPreset} />
      <DesignPresetPicker current={designPreset} onChange={setDesignPreset} />
    </>
  );
}
```

### Available Theme Context Values

```typescript
interface ThemeContextValue {
  // Mode
  mode: "light" | "dark";
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;

  // Radius mode (legacy)
  radiusMode: "tiny" | "default";
  toggleRadiusMode: () => void;

  // Color preset
  colorPreset: ColorPresetId;
  setColorPreset: (id: ColorPresetId) => void;

  // Design preset
  designPreset: DesignPresetId;
  setDesignPreset: (id: DesignPresetId) => void;

  // Additional customization
  backgroundMode: "default" | "gradient" | "flickering";
  setBackgroundMode: (mode: BackgroundMode) => void;
  fontScale: "small" | "default" | "large" | "x-large";
  setFontScale: (scale: FontScale) => void;
  uiDensity: "compact" | "comfortable" | "spacious";
  setUIDensity: (density: UIDensity) => void;
}
```

---

## Using Themes in Components

### With MUI Components

```tsx
import { Button, Paper } from "@mui/material";
import { useTheme } from "@mui/material/styles";

function MyComponent() {
  const theme = useTheme();

  return (
    <Paper
      sx={{
        backgroundColor: theme.palette.background.paper,
        borderRadius: theme.shape.borderRadius,
        padding: theme.spacing(2),
      }}
    >
      <Button color="primary">Styled Button</Button>
    </Paper>
  );
}
```

### With Custom Hook (Recommended)

```tsx
import { useAppTheme } from "@shared/theme/hooks/useAppTheme";

function MyComponent() {
  const { palette, effects, motion } = useAppTheme();

  return (
    <div
      style={{
        backgroundColor: palette.background.primary,
        borderRadius: effects.borderRadius.medium,
        transition: motion.transition.standard,
      }}
    >
      Content
    </div>
  );
}
```

---

## Persistence

All theme settings persist to localStorage:

| Setting         | Key              | Default       |
| --------------- | ---------------- | ------------- |
| Mode            | `themeMode`      | `light`       |
| Radius Mode     | `radiusMode`     | `default`     |
| Color Preset    | `colorPreset`    | `oceanBlue`   |
| Design Preset   | `designPreset`   | `default`     |
| Background Mode | `backgroundMode` | `default`     |
| Font Scale      | `fontScale`      | `default`     |
| UI Density      | `uiDensity`      | `comfortable` |

Settings auto-load on app startup via `ThemeContext` initialization.

---

## Adding New Color Presets

1. Create file in `colorPresets/`:

```typescript
// colorPresets/cosmicPurple.ts
import type { ColorPreset } from "../types";

export const cosmicPurple: ColorPreset = {
  id: "cosmicPurple",
  name: "Cosmic Purple",
  description: "Deep space purples with starlight accents",
  paletteOverrides: {
    light: {
      primary: "#7B2CBF",
      secondary: "#C77DFF",
      accent: "#E0AAFF",
    },
    dark: {
      primary: "#9D4EDD",
      secondary: "#C77DFF",
      accent: "#E0AAFF",
    },
  },
};
```

2. Export in `colorPresets/index.ts`:

```typescript
export * from "./cosmicPurple";
export const colorPresets = [
  /* ... existing */
  cosmicPurple,
];
```

3. Update type in `composer.ts`:

```typescript
export type ColorPresetId =
  | "oceanBlue"
  | "forestGreen"
  /* ... existing */
  | "cosmicPurple";
```

---

## Adding New Design Presets

1. Create file in `designPresets/`:

```typescript
// designPresets/neonGlow.ts
import type { DesignPreset } from "../types";

export const neonGlow: DesignPreset = {
  id: "neonGlow",
  name: "Neon Glow",
  description: "Cyberpunk-inspired with glowing borders",
  effects: {
    borderRadius: "4px",
    shadowStrength: "strong",
    glassMorphism: false,
  },
  // ... full effect overrides
};
```

2. Export in `designPresets/index.ts`

3. Update type in `composer.ts`

---

## Best Practices

### Do:

- Use `composeTheme()` for dynamic theme creation
- Use `useAppTheme()` hook for token access
- Keep color presets focused on palette only
- Keep design presets focused on shapes/effects only
- Test both light and dark modes

### Don't:

- Mix color and design logic in presets
- Hardcode colors in components (use theme tokens)
- Bypass ThemeContext for theme changes
- Forget to add persistence for new settings

---

## Testing Themes

```tsx
import { composeTheme } from "@shared/theme";
import { ThemeProvider } from "@mui/material/styles";

function TestTheme() {
  const testTheme = composeTheme({
    mode: "dark",
    colorPreset: "forestGreen",
    designPreset: "sleekGlass",
  });

  return (
    <ThemeProvider theme={testTheme}>{/* Your component */}</ThemeProvider>
  );
}
```

---

## Migration from Legacy Presets

Legacy combined presets (`defaultPreset`, `modernPreset`, etc.) are still supported but deprecated. To migrate:

```typescript
// OLD (legacy)
applyPreset("modernPreset");

// NEW (separated)
setColorPreset("oceanBlue");
setDesignPreset("sleekGlass");
```

---

## Future Enhancements

- Custom color preset creator UI
- Theme sharing/import/export
- Per-workspace theme overrides
- Accessibility contrast checker
- Theme animation transitions
