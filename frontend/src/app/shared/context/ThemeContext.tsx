/**
 * THEME CONTEXT (Global Theme State)
 *
 * Purpose:
 * - Manage light/dark mode switching across entire application
 * - Persist theme preference in localStorage
 * - Support radius mode (tiny vs default border radius)
 * - Apply theme presets for quick color scheme changes
 *
 * Theme System:
 * - Two base themes: lightTheme, darkTheme (from @shared/theme)
 * - Design token system with palette, effects, motion, interaction tokens
 * - MUI ThemeProvider wraps entire app for consistent styling
 * - CSS variables exported for non-MUI components
 *
 * Persistence:
 * - Theme mode stored in localStorage (key: 'themeMode')
 * - Radius mode stored in localStorage (key: 'radiusMode')
 * - Preset stored in localStorage (key: 'themePreset')
 * - Auto-load on app startup
 *
 * Backend Connection:
 * - No backend integration (purely client-side)
 * - User theme preference could be stored in profiles table (future)
 *
 * Usage:
 *   import { useTheme } from '@shared/context/ThemeContext';
 *
 *   function MyComponent() {
 *     const { mode, toggleMode, radiusMode, toggleRadiusMode } = useTheme();
 *
 *     return (
 *       <Button onClick={toggleMode}>
 *         Switch to {mode === 'light' ? 'dark' : 'light'} mode
 *       </Button>
 *     );
 *   }
 *
 * Provider Setup:
 *   <ThemeProvider>
 *     <App />
 *   </ThemeProvider>
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import {
  darkTheme,
  lightTheme,
  type ThemeMode,
  // Legacy preset support (kept for backwards compatibility)
  type PresetId,
  applyPresetById,
  isValidPreset,
  // New preset system
  type ColorPresetId,
  type DesignPresetId,
  isValidColorPreset,
  isValidDesignPreset,
  // New theme composer
  composeTheme,
} from "@shared/theme";
import lightPaletteTokens from "@shared/theme/palettes/lightPalette";
import darkPaletteTokens from "@shared/theme/palettes/darkPalette";

/** Font scale for accessibility - affects all text sizes */
export type FontScale = "small" | "default" | "large" | "x-large";

/** UI density - affects spacing and component sizes */
export type UIDensity = "compact" | "comfortable" | "spacious";

/** Subtle background treatments for authenticated pages */
export type BackgroundStyle = "plain" | "noise" | "vignette" | "grid";

interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  radiusMode: "tiny" | "default";
  toggleRadiusMode: () => void;

  // Legacy preset support (kept for backwards compatibility)
  currentPreset: PresetId | null;
  applyPreset: (presetId: PresetId) => void;
  clearPreset: () => void;

  // New preset system - separated color and design
  colorPreset: ColorPresetId;
  setColorPreset: (presetId: ColorPresetId) => void;
  designPreset: DesignPresetId;
  setDesignPreset: (presetId: DesignPresetId) => void;

  // Accessibility and customization
  fontScale: FontScale;
  setFontScale: (scale: FontScale) => void;
  reducedMotion: boolean;
  setReducedMotion: (enabled: boolean) => void;
  uiDensity: UIDensity;
  setUIDensity: (density: UIDensity) => void;

  // Custom accent color (overrides color preset primary)
  customAccentColor: string | null;
  setCustomAccentColor: (color: string | null) => void;

  // Authenticated background style (public pages stay solid)
  backgroundStyle: BackgroundStyle;
  setBackgroundStyle: (style: BackgroundStyle) => void;

  // Reset all settings to defaults
  resetToDefaults: () => void;

  // Export/import theme settings
  exportSettings: () => string;
  importSettings: (settings: string) => boolean;
}

const STORAGE_KEY = "app.theme.mode";
const PRESET_STORAGE_KEY = "app.theme.preset";
const COLOR_PRESET_KEY = "app.theme.colorPreset";
const DESIGN_PRESET_KEY = "app.theme.designPreset";
const FONT_SCALE_KEY = "app.theme.fontScale";
const REDUCED_MOTION_KEY = "app.theme.reducedMotion";
const UI_DENSITY_KEY = "app.theme.uiDensity";
const CUSTOM_ACCENT_KEY = "app.theme.customAccent";
const BACKGROUND_STYLE_KEY = "app.theme.backgroundStyle";

const isValidBackgroundStyle = (value: string): value is BackgroundStyle => {
  return (
    value === "plain" ||
    value === "noise" ||
    value === "vignette" ||
    value === "grid"
  );
};

// ******************** Context & Hook *******************

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// Hook to access theme context - exported before provider for Fast Refresh compatibility
export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useThemeContext must be used within ThemeContextProvider");
  }
  return context;
};

// ******************** Helper Functions *******************

const readStoredMode = (): ThemeMode | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") {
    return stored;
  }

  return null;
};

const detectPreferredMode = (): ThemeMode => {
  if (typeof window === "undefined") {
    return "light";
  }

  const prefersDark = window.matchMedia?.(
    "(prefers-color-scheme: dark)"
  ).matches;
  return prefersDark ? "dark" : "light";
};

const persistMode = (mode: ThemeMode) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // Swallow storage errors (e.g., Safari private mode).
  }
};

const readStoredPreset = (): PresetId | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const stored = window.localStorage.getItem(PRESET_STORAGE_KEY);
  if (stored && isValidPreset(stored)) {
    return stored as PresetId;
  }

  return null;
};

const persistPreset = (presetId: PresetId | null) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (presetId) {
      window.localStorage.setItem(PRESET_STORAGE_KEY, presetId);
    } else {
      window.localStorage.removeItem(PRESET_STORAGE_KEY);
    }
  } catch {
    // Swallow storage errors
  }
};

// New preset system helpers
const readStoredColorPreset = (): ColorPresetId => {
  if (typeof window === "undefined") {
    return "default";
  }

  const stored = window.localStorage.getItem(COLOR_PRESET_KEY);
  if (stored && isValidColorPreset(stored)) {
    return stored;
  }

  return "default";
};

const persistColorPreset = (presetId: ColorPresetId) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(COLOR_PRESET_KEY, presetId);
  } catch {
    // Swallow storage errors
  }
};

const readStoredDesignPreset = (): DesignPresetId => {
  if (typeof window === "undefined") {
    return "default";
  }

  // For now, we only expose three design styles.
  const allowed: readonly DesignPresetId[] = [
    "default",
    "extraSharp",
    "rounded",
  ];

  const stored = window.localStorage.getItem(DESIGN_PRESET_KEY);
  // Migrate older id used earlier in the project.
  if (stored === "sharp") {
    return "default";
  }
  if (
    stored &&
    isValidDesignPreset(stored) &&
    (allowed as readonly string[]).includes(stored)
  ) {
    return stored as DesignPresetId;
  }

  return "default";
};

const persistDesignPreset = (presetId: DesignPresetId) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(DESIGN_PRESET_KEY, presetId);
  } catch {
    // Swallow storage errors
  }
};

// New accessibility/customization helpers
const readStoredFontScale = (): FontScale => {
  if (typeof window === "undefined") return "default";
  const stored = window.localStorage.getItem(FONT_SCALE_KEY);
  if (stored === "small" || stored === "large" || stored === "x-large") {
    return stored;
  }
  return "default";
};

const persistFontScale = (scale: FontScale) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(FONT_SCALE_KEY, scale);
  } catch {
    // Swallow
  }
};

const readStoredReducedMotion = (): boolean => {
  if (typeof window === "undefined") return false;
  // Default to system preference
  const prefersReduced = window.matchMedia?.(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  const stored = window.localStorage.getItem(REDUCED_MOTION_KEY);
  if (stored === "true") return true;
  if (stored === "false") return false;
  return prefersReduced;
};

const persistReducedMotion = (enabled: boolean) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(REDUCED_MOTION_KEY, String(enabled));
  } catch {
    // Swallow
  }
};

const readStoredUIDensity = (): UIDensity => {
  if (typeof window === "undefined") return "comfortable";
  const stored = window.localStorage.getItem(UI_DENSITY_KEY);
  if (stored === "compact" || stored === "spacious") {
    return stored;
  }
  return "comfortable";
};

const persistUIDensity = (density: UIDensity) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(UI_DENSITY_KEY, density);
  } catch {
    // Swallow
  }
};

const readStoredCustomAccent = (): string | null => {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(CUSTOM_ACCENT_KEY);
  // Validate it's a hex color
  if (stored && /^#[0-9A-Fa-f]{6}$/.test(stored)) {
    return stored;
  }
  return null;
};

const persistCustomAccent = (color: string | null) => {
  if (typeof window === "undefined") return;
  try {
    if (color) {
      window.localStorage.setItem(CUSTOM_ACCENT_KEY, color);
    } else {
      window.localStorage.removeItem(CUSTOM_ACCENT_KEY);
    }
  } catch {
    // Swallow
  }
};

const readStoredBackgroundStyle = (): BackgroundStyle => {
  if (typeof window === "undefined") return "noise";
  const stored = window.localStorage.getItem(BACKGROUND_STYLE_KEY);
  if (stored && isValidBackgroundStyle(stored)) {
    return stored;
  }
  return "noise";
};

const persistBackgroundStyle = (style: BackgroundStyle) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(BACKGROUND_STYLE_KEY, style);
  } catch {
    // Swallow
  }
};

// ******************** Provider Component *******************

export function ThemeContextProvider({ children }: PropsWithChildren<unknown>) {
  const [mode, setModeState] = useState<ThemeMode>(
    () => readStoredMode() ?? detectPreferredMode()
  );
  const [radiusMode, setRadiusMode] = useState<"tiny" | "default">(() => {
    if (typeof window === "undefined") return "tiny";
    const stored = window.localStorage.getItem("app.theme.radiusMode");
    return stored === "default" ? "default" : "tiny";
  });
  // Legacy preset state (for backwards compatibility)
  const [currentPreset, setCurrentPreset] = useState<PresetId | null>(() =>
    readStoredPreset()
  );
  // New preset system - separate color and design
  const [colorPreset, setColorPresetState] = useState<ColorPresetId>(() =>
    readStoredColorPreset()
  );
  const [designPreset, setDesignPresetState] = useState<DesignPresetId>(() =>
    readStoredDesignPreset()
  );

  // New accessibility and customization state
  const [fontScale, setFontScaleState] = useState<FontScale>(() =>
    readStoredFontScale()
  );
  const [reducedMotion, setReducedMotionState] = useState<boolean>(() =>
    readStoredReducedMotion()
  );
  const [uiDensity, setUIDensityState] = useState<UIDensity>(() =>
    readStoredUIDensity()
  );
  const [customAccentColor, setCustomAccentState] = useState<string | null>(
    () => readStoredCustomAccent()
  );
  const [backgroundStyle, setBackgroundStyleState] = useState<BackgroundStyle>(
    () => readStoredBackgroundStyle()
  );

  useEffect(() => {
    persistMode(mode);

    if (typeof document !== "undefined") {
      document.documentElement.dataset.theme = mode;
      document.documentElement.style.colorScheme = mode;
    }
  }, [mode]);

  useEffect(() => {
    persistPreset(currentPreset);
  }, [currentPreset]);

  // Persist new preset changes
  useEffect(() => {
    persistColorPreset(colorPreset);
  }, [colorPreset]);

  useEffect(() => {
    persistDesignPreset(designPreset);
  }, [designPreset]);

  // Persist new accessibility/customization settings
  useEffect(() => {
    persistFontScale(fontScale);
    // Apply font scale to document
    if (typeof document !== "undefined") {
      const scales: Record<FontScale, string> = {
        small: "14px",
        default: "16px",
        large: "18px",
        "x-large": "20px",
      };
      document.documentElement.style.fontSize = scales[fontScale];
    }
  }, [fontScale]);

  useEffect(() => {
    persistReducedMotion(reducedMotion);
    // Apply reduced motion to document
    if (typeof document !== "undefined") {
      document.documentElement.dataset.reducedMotion = String(reducedMotion);
    }
  }, [reducedMotion]);

  useEffect(() => {
    persistUIDensity(uiDensity);
    // Apply UI density as data attribute for CSS targeting
    if (typeof document !== "undefined") {
      document.documentElement.dataset.density = uiDensity;
    }
  }, [uiDensity]);

  useEffect(() => {
    persistCustomAccent(customAccentColor);
  }, [customAccentColor]);

  useEffect(() => {
    persistBackgroundStyle(backgroundStyle);
  }, [backgroundStyle]);

  // New preset setters
  const setColorPreset = useCallback((presetId: ColorPresetId) => {
    setColorPresetState(presetId);
  }, []);

  const setDesignPreset = useCallback((presetId: DesignPresetId) => {
    // For now, we only expose three design styles.
    const allowed: readonly DesignPresetId[] = [
      "default",
      "extraSharp",
      "rounded",
    ];
    if ((allowed as readonly string[]).includes(presetId)) {
      setDesignPresetState(presetId);
      return;
    }
    setDesignPresetState("default");
  }, []);

  // New accessibility/customization setters
  const setFontScale = useCallback((scale: FontScale) => {
    setFontScaleState(scale);
  }, []);

  const setReducedMotion = useCallback((enabled: boolean) => {
    setReducedMotionState(enabled);
  }, []);

  const setUIDensity = useCallback((density: UIDensity) => {
    setUIDensityState(density);
  }, []);

  const setCustomAccentColor = useCallback((color: string | null) => {
    setCustomAccentState(color);
  }, []);

  const setBackgroundStyle = useCallback((style: BackgroundStyle) => {
    setBackgroundStyleState(style);
  }, []);

  // Reset all settings to defaults
  const resetToDefaults = useCallback(() => {
    setModeState(detectPreferredMode());
    setColorPresetState("default");
    setDesignPresetState("default");
    setFontScaleState("default");
    setReducedMotionState(false);
    setUIDensityState("comfortable");
    setCustomAccentState(null);
    setCurrentPreset(null);
    setBackgroundStyleState("noise");
  }, []);

  // Export all theme settings as JSON string
  const exportSettings = useCallback(() => {
    return JSON.stringify({
      version: 1,
      mode,
      colorPreset,
      designPreset,
      fontScale,
      reducedMotion,
      uiDensity,
      customAccentColor,
      backgroundStyle,
    });
  }, [
    mode,
    colorPreset,
    designPreset,
    fontScale,
    reducedMotion,
    uiDensity,
    customAccentColor,
    backgroundStyle,
  ]);

  // Import theme settings from JSON string
  const importSettings = useCallback((settingsJson: string): boolean => {
    try {
      const settings = JSON.parse(settingsJson);
      if (settings.version !== 1) return false;

      if (settings.mode) setModeState(settings.mode);
      if (settings.colorPreset && isValidColorPreset(settings.colorPreset)) {
        setColorPresetState(settings.colorPreset);
      }
      // For now, we only accept these three design styles (and migrate old 'sharp' -> 'default').
      const allowed: readonly DesignPresetId[] = [
        "default",
        "extraSharp",
        "rounded",
      ];
      if (settings.designPreset === "sharp") {
        setDesignPresetState("default");
      } else if (
        settings.designPreset &&
        isValidDesignPreset(settings.designPreset) &&
        (allowed as readonly string[]).includes(settings.designPreset)
      ) {
        setDesignPresetState(settings.designPreset);
      } else {
        setDesignPresetState("default");
      }
      if (settings.fontScale) setFontScaleState(settings.fontScale);
      if (typeof settings.reducedMotion === "boolean") {
        setReducedMotionState(settings.reducedMotion);
      }
      if (settings.uiDensity) setUIDensityState(settings.uiDensity);
      if (settings.customAccentColor) {
        setCustomAccentState(settings.customAccentColor);
      }
      if (typeof settings.backgroundStyle === "string") {
        setBackgroundStyleState(
          isValidBackgroundStyle(settings.backgroundStyle)
            ? settings.backgroundStyle
            : "noise"
        );
      }

      return true;
    } catch {
      return false;
    }
  }, []);

  // Determine theme using the new composition system.
  // Priority: legacy preset (back-compat) > composed theme.
  const theme = useMemo(() => {
    // Legacy preset support - if a legacy preset is active, use it
    if (currentPreset) {
      const baseTokens =
        mode === "dark" ? darkPaletteTokens : lightPaletteTokens;
      return applyPresetById(currentPreset, baseTokens);
    }

    // Default: use the composed theme even when using default settings.
    // This keeps the app's default styling consistent with the new preset system.
    return composeTheme({
      mode,
      colorPresetId: colorPreset,
      designPresetId: designPreset,
      customAccentColor,
      reducedMotion,
    });
  }, [
    mode,
    currentPreset,
    colorPreset,
    designPreset,
    customAccentColor,
    reducedMotion,
  ]);

  useEffect(() => {
    if (typeof window === "undefined" || readStoredMode() !== null) {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event: MediaQueryListEvent) => {
      setModeState(event.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  /**
   * Helper to get the matching preset for the opposite mode
   * e.g., "creative-light" -> "creative-dark" when switching to dark mode
   */
  const getMatchingPreset = useCallback(
    (newMode: ThemeMode, preset: PresetId | null): PresetId | null => {
      if (!preset) return null;

      // Extract the category from the preset ID (e.g., "creative" from "creative-light")
      const parts = preset.split("-");
      if (parts.length < 2) return null;

      const category = parts.slice(0, -1).join("-"); // Handle multi-word categories
      const targetPresetId = `${category}-${newMode}` as PresetId;

      // Verify the target preset exists
      if (isValidPreset(targetPresetId)) {
        return targetPresetId;
      }

      return null;
    },
    []
  );

  const setMode = useCallback(
    (nextMode: ThemeMode) => {
      setModeState(nextMode);
      // Auto-sync preset to matching mode variant
      const matchingPreset = getMatchingPreset(nextMode, currentPreset);
      if (matchingPreset && matchingPreset !== currentPreset) {
        setCurrentPreset(matchingPreset);
      }
    },
    [currentPreset, getMatchingPreset]
  );

  const toggleMode = useCallback(() => {
    setModeState((prev) => {
      const nextMode = prev === "light" ? "dark" : "light";
      // Auto-sync preset to matching mode variant
      const matchingPreset = getMatchingPreset(nextMode, currentPreset);
      if (matchingPreset && matchingPreset !== currentPreset) {
        setCurrentPreset(matchingPreset);
      }
      return nextMode;
    });
  }, [currentPreset, getMatchingPreset]);

  const handleApplyPreset = useCallback((presetId: PresetId) => {
    setCurrentPreset(presetId);
  }, []);

  const handleClearPreset = useCallback(() => {
    setCurrentPreset(null);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      setMode,
      toggleMode,
      radiusMode,
      toggleRadiusMode: () =>
        setRadiusMode((p) => (p === "tiny" ? "default" : "tiny")),
      // Legacy preset support
      currentPreset,
      applyPreset: handleApplyPreset,
      clearPreset: handleClearPreset,
      // New preset system
      colorPreset,
      setColorPreset,
      designPreset,
      setDesignPreset,
      // Accessibility and customization
      fontScale,
      setFontScale,
      reducedMotion,
      setReducedMotion,
      uiDensity,
      setUIDensity,
      customAccentColor,
      setCustomAccentColor,
      backgroundStyle,
      setBackgroundStyle,
      // Utility functions
      resetToDefaults,
      exportSettings,
      importSettings,
    }),
    [
      mode,
      setMode,
      toggleMode,
      radiusMode,
      currentPreset,
      handleApplyPreset,
      handleClearPreset,
      colorPreset,
      setColorPreset,
      designPreset,
      setDesignPreset,
      fontScale,
      setFontScale,
      reducedMotion,
      setReducedMotion,
      uiDensity,
      setUIDensity,
      customAccentColor,
      setCustomAccentColor,
      backgroundStyle,
      setBackgroundStyle,
      resetToDefaults,
      exportSettings,
      importSettings,
    ]
  );

  // Apply corner radius mode via CSS variables overriding factory defaults
  useEffect(() => {
    if (typeof document === "undefined") return;
    try {
      window.localStorage.setItem("app.theme.radiusMode", radiusMode);
    } catch {
      // ignore storage errors
    }
    const root = document.documentElement;
    const tokens = (
      theme as unknown as {
        designTokens?: {
          effects?: {
            borderRadius?: { sm?: number; md?: number; lg?: number };
          };
        };
      }
    ).designTokens;
    const br = tokens?.effects?.borderRadius ?? { sm: 2, md: 4, lg: 6 };
    if (radiusMode === "tiny") {
      // Tiny mode is intentionally subtle: corners should read as essentially square.
      root.style.setProperty("--radius-sm", `1px`);
      root.style.setProperty("--radius-md", `2px`);
      root.style.setProperty("--radius-lg", `3px`);
    } else {
      root.style.setProperty("--radius-sm", `${br.sm ?? 2}px`);
      root.style.setProperty("--radius-md", `${br.md ?? 4}px`);
      root.style.setProperty("--radius-lg", `${br.lg ?? 6}px`);
    }
  }, [radiusMode, theme]);

  return (
    <ThemeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}
