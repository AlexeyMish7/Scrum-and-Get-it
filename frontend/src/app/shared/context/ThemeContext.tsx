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
import { darkTheme, lightTheme, type ThemeMode } from "@shared/theme";

interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  radiusMode: "tiny" | "default";
  toggleRadiusMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = "app.theme.mode";

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

export function ThemeContextProvider({ children }: PropsWithChildren<unknown>) {
  const [mode, setModeState] = useState<ThemeMode>(
    () => readStoredMode() ?? detectPreferredMode()
  );
  const [radiusMode, setRadiusMode] = useState<"tiny" | "default">(() => {
    if (typeof window === "undefined") return "tiny";
    const stored = window.localStorage.getItem("app.theme.radiusMode");
    return stored === "default" ? "default" : "tiny";
  });

  useEffect(() => {
    persistMode(mode);

    if (typeof document !== "undefined") {
      document.documentElement.dataset.theme = mode;
      document.documentElement.style.colorScheme = mode;
    }
  }, [mode]);

  const theme = mode === "dark" ? darkTheme : lightTheme;

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

  const setMode = useCallback((nextMode: ThemeMode) => {
    setModeState(nextMode);
  }, []);

  const toggleMode = useCallback(() => {
    setModeState((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      setMode,
      toggleMode,
      radiusMode,
      toggleRadiusMode: () =>
        setRadiusMode((p) => (p === "tiny" ? "default" : "tiny")),
    }),
    [mode, setMode, toggleMode, radiusMode]
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

// eslint-disable-next-line react-refresh/only-export-components
export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useThemeContext must be used within ThemeContextProvider");
  }
  return context;
};
