import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ThemeContextValue, ThemeMode, HighContrast } from "./types";

const ThemeContext = createContext<ThemeContextValue | null>(null);

const defaultState: ThemeContextValue = {
  theme: "light",
  highContrast: false,
  setTheme: () => {},
  setHighContrast: () => {},
  toggleTheme: () => {},
  toggleHighContrast: () => {},
};

export interface ThemeProviderProps {
  children: ReactNode;
  /** Initial theme mode. */
  initialTheme?: ThemeMode;
  /** Initial high-contrast value. */
  initialHighContrast?: HighContrast;
}

export function ThemeProvider({
  children,
  initialTheme = "light",
  initialHighContrast = false,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeMode>(initialTheme);
  const [highContrast, setHighContrastState] = useState<HighContrast>(
    initialHighContrast
  );

  const setTheme = useCallback((next: ThemeMode) => {
    setThemeState(next);
  }, []);

  const setHighContrast = useCallback((next: HighContrast) => {
    setHighContrastState(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  const toggleHighContrast = useCallback(() => {
    setHighContrastState((prev) => !prev);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      highContrast,
      setTheme,
      setHighContrast,
      toggleTheme,
      toggleHighContrast,
    }),
    [
      theme,
      highContrast,
      setTheme,
      setHighContrast,
      toggleTheme,
      toggleHighContrast,
    ]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

/**
 * Returns the theme context value. Throws if used outside ThemeProvider.
 */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (ctx === null) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}

/**
 * Optional theme hook. Returns default state when outside ThemeProvider.
 * Use when you need theme in a component that might render without the provider.
 */
export function useThemeOptional(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  return ctx ?? defaultState;
}
