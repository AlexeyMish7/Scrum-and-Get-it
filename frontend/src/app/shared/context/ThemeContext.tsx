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
  type PresetId,
  applyPresetById,
  isValidPreset,
} from "@shared/theme";
import lightPaletteTokens from "@shared/theme/palettes/lightPalette";
import darkPaletteTokens from "@shared/theme/palettes/darkPalette";

/** Background mode - default is solid background, gradient uses animated gradient */
export type BackgroundMode = "default" | "gradient";

interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  radiusMode: "tiny" | "default";
  toggleRadiusMode: () => void;
  // Preset support
  currentPreset: PresetId | null;
  applyPreset: (presetId: PresetId) => void;
  clearPreset: () => void;
  // Background mode
  backgroundMode: BackgroundMode;
  setBackgroundMode: (mode: BackgroundMode) => void;
}

const STORAGE_KEY = "app.theme.mode";
const PRESET_STORAGE_KEY = "app.theme.preset";
const BACKGROUND_MODE_KEY = "app.theme.backgroundMode";

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

const readStoredBackgroundMode = (): BackgroundMode => {
  if (typeof window === "undefined") {
    return "default";
  }

  const stored = window.localStorage.getItem(BACKGROUND_MODE_KEY);
  if (stored === "gradient") {
    return "gradient";
  }

  return "default";
};

const persistBackgroundMode = (bgMode: BackgroundMode) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(BACKGROUND_MODE_KEY, bgMode);
  } catch {
    // Swallow storage errors
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
  const [currentPreset, setCurrentPreset] = useState<PresetId | null>(() =>
    readStoredPreset()
  );
  const [backgroundMode, setBackgroundModeState] = useState<BackgroundMode>(
    () => readStoredBackgroundMode()
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

  // Persist background mode changes
  useEffect(() => {
    persistBackgroundMode(backgroundMode);
  }, [backgroundMode]);

  // Background mode setter with persistence
  const setBackgroundMode = useCallback((newMode: BackgroundMode) => {
    setBackgroundModeState(newMode);
  }, []);

  // Determine theme: use preset if set, otherwise use default light/dark theme
  const theme = useMemo(() => {
    if (currentPreset) {
      const baseTokens =
        mode === "dark" ? darkPaletteTokens : lightPaletteTokens;
      return applyPresetById(currentPreset, baseTokens);
    }
    return mode === "dark" ? darkTheme : lightTheme;
  }, [mode, currentPreset]);

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
      currentPreset,
      applyPreset: handleApplyPreset,
      clearPreset: handleClearPreset,
      backgroundMode,
      setBackgroundMode,
    }),
    [
      mode,
      setMode,
      toggleMode,
      radiusMode,
      currentPreset,
      handleApplyPreset,
      handleClearPreset,
      backgroundMode,
      setBackgroundMode,
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
      root.style.setProperty("--radius-sm", `2px`);
      root.style.setProperty("--radius-md", `4px`);
      root.style.setProperty("--radius-lg", `6px`);
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
