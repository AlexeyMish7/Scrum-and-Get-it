# Theming Guide

This guide explains how themes work in this project and, first and foremost, the rules for building frontend code so visuals stay palette-driven.

## Rules of engagement (do this, not that)

Keep it simple—follow these and you’re good:

- Don’t set colors/shadows/radius yourself. Use MUI components and props; visuals come from the palette.
- Don’t add CSS to change how MUI looks. Use `sx` only for layout (spacing, size, flex/grid, position, overflow).
- Don’t import the theme or factory in feature files. The app is already wrapped globally.
- Do use MUI props to pick variants the theme styles: `variant`, `color`, `size`.
- Do change visuals by editing the palette files (colors, depth, glow, radii, navbar, interaction)—not page code.

Allowed layout-only example

```tsx
<Stack sx={{ gap: 2, p: 2, maxWidth: 600, mx: "auto" }}>
  <TextField fullWidth label="Email" />
  <Button variant="contained" color="primary">
    Continue
  </Button>
</Stack>
```

## Architecture

- Token-first: We define a small design system via tokens (colors, radii, depth, glow, interaction, inputs, motion) in `src/app/shared/theme/palettes/*`.
- Factory: `factory.ts` converts tokens into an MUI Theme with palette, typography, transitions, and component `styleOverrides`.
- Instances: `lightTheme.tsx` and `darkTheme.tsx` build the MUI Themes from `lightPalette.ts` and `darkPalette.ts`.
- Consumption: `ThemeContext` switches between the two themes at runtime and applies `CssBaseline`.

Key files:

- `types.ts` – Token TypeScript interfaces + MUI module augmentation
- `palettes/lightPalette.ts` and `palettes/darkPalette.ts` – default token sets
- `factory.ts` – builds `Theme` from tokens
- `lightTheme.tsx`, `darkTheme.tsx`, `index.ts` – expose the ready themes
- `@shared/context/ThemeContext.tsx` – Theme mode toggle and corner-radius mode CSS vars

## Tokens → MUI Theme (Flow)

1. Palette

- Maps `palette.*` tokens (primary/secondary/tertiary/background/surface/text/error/etc.) into MUI `theme.palette`.
- `palette.appBar` is used by `TopNav` to render a glassy header with `bg`, `color`, `border`, `glassOpacity`, `blur`.

2. Effects

- `effects.elevation` provides box-shadow strings. The factory also reads `effects.depth` (flat/subtle/normal/strong) and scales rgba alpha to globally adjust perceived depth.
- `effects.focusRing` provides color/width for focus states.
- `effects.glow` adds a soft glow to selected components (appliesTo flags: `button`, `card`, `paper`, `inputFocus`).
- `effects.borderRadius` sets global corners (sm/md/lg/xl). Component overrides use CSS vars (`--radius-*`) so the values can be applied consistently.

3. Motion

- `motion.duration` and `motion.easing` feed MUI transitions for hover/active animations.

4. Interaction

- Controls hover/press behavior for interactive components (notably `MuiButton`):
  - `hoverOverlay`/`activeOverlay` add a temporary background tint
  - `hoverElevationScale`/`activeElevationScale` increase shadow intensity
  - `hoverGlow`/`activeGlow` can force glow on state changes
  - `pressTransform` (e.g., `scale(0.99)`) adds tactile feedback

5. Inputs

- `input.bg` and `input.border` define Outlined/Filled Input backgrounds and borders to ensure contrast (especially in dark mode).

## Component Overrides

- `MuiButton`

  - Corner radius: `--radius-md` (tokens.effects.borderRadius.md)
  - Hover/Active use interaction overlays and shadow scaling
  - Optional glow blended with state on hover/active

- `MuiTextField`

  - defaultProps: `variant: "outlined"`

- `MuiOutlinedInput`/`MuiFilledInput`

  - Background from `input.bg`, borders from `input.border`
  - Focus ring uses `effects.focusRing`; glow can be added for `inputFocus`

- `MuiPaper`/`MuiCard`
  - Corner radius: `--radius-lg`
  - Box-shadow uses `elevation.level1` adjusted by `effects.depth`; optional glow if enabled in tokens

## Navbar (TopNav)

- Uses `palette.appBar` to render a glassy header:
  - `bg`, `color`, `border`, `glassOpacity`, `blur`
- Slight opacity increase when scrolled for a dynamic feel
- Icons/buttons sized up for clarity (configurable in code if needed)

## Runtime Controls

- Theme mode: `light`/`dark` toggle is provided by `ThemeContext`.
- Corners: `ThemeContext` exposes a `radiusMode` ("tiny" | "default") that swaps CSS `--radius-*` variables to quickly preview sharper vs default corners.
- Glow and depth are theme-driven (palette-controlled); no runtime toggles are provided by default.

## Creating/Using a Custom Palette

1. Create a new palette file under `palettes/` (see `PALETTE_BLUEPRINT.md` for a full example).
2. Import the palette into a theme file (e.g., clone `lightTheme.tsx` → `myTheme.tsx`).
3. Switch to your theme by modifying `ThemeContext` to load it or temporarily replace `lightTheme`/`darkTheme` in `index.ts`.

You don’t need to import any theme files in feature components — just use MUI components. The active theme is applied globally.

## CSS Variables

The factory exports a few CSS variables for non-MUI areas:

- `--input-bg`, `--input-border`
- `--radius-sm`, `--radius-md`, `--radius-lg`

`ThemeContext` may override `--radius-*` based on `radiusMode` to demo corner changes without recreating the theme.

## Best Practices

- Keep dark surfaces near-opaque for readability.
- Prefer tiny radii (2/4/6/8px) for sharper look.
- Keep glow subtle; too much alpha feels noisy.
- Adjust hover/active overlays to be barely visible but helpful.
- Let `palette.appBar` define your header; avoid manual color overrides in components.

## Troubleshooting

- If an interactive element doesn’t look right on hover/active, check `interaction.*` values in your palette.
- Inputs hard to read in dark mode? Increase `input.bg` alpha or `input.border` contrast.
- Glow too strong? Lower the alpha in `effects.glow.color` or disable the `appliesTo` flag for that component.
