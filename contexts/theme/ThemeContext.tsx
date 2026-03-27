import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useColorScheme } from "react-native";
import type { ThemeContextValue, ThemeMode, ResolvedTheme, HighContrast } from "./types";
import { setLiveThemeSnapshot } from "./onboardingStyles";

const ThemeContext = createContext<ThemeContextValue | null>(null);

const defaultState: ThemeContextValue = {
  theme: "system",
  resolvedTheme: "light",
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
}

export function ThemeProvider({
  children,
  initialTheme = "system",
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeMode>(initialTheme);
  const systemColorScheme = useColorScheme();
  const highContrast: HighContrast =
    theme === "darkHighContrast" || theme === "lightHighContrast";

  const resolvedTheme: ResolvedTheme = useMemo(() => {
    if (theme === "system") {
      return systemColorScheme === "dark" ? "dark" : "light";
    }
    if (theme === "colonthree" || theme === "darkHighContrast") {
      return "dark";
    }
    if (theme === "lightHighContrast") {
      return "light";
    }
    return theme as ResolvedTheme;
  }, [theme, systemColorScheme]);

  // Keep style helpers in sync with live theme state to avoid visual lag.
  setLiveThemeSnapshot({ themeMode: theme, highContrast });

  const setTheme = useCallback((next: ThemeMode) => {
    setThemeState(next);
  }, []);

  const setHighContrast = useCallback((next: HighContrast) => {
    setThemeState((prev) => {
      const baseResolved =
        prev === "colonthree" || prev === "dark" || prev === "darkHighContrast"
          ? "dark"
          : prev === "light" || prev === "lightHighContrast"
            ? "light"
            : systemColorScheme === "dark"
              ? "dark"
              : "light";
      if (next) {
        return baseResolved === "dark" ? "darkHighContrast" : "lightHighContrast";
      }
      if (prev === "darkHighContrast") return "dark";
      if (prev === "lightHighContrast") return "light";
      return prev;
    });
  }, [systemColorScheme]);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      if (prev === "system") {
        return resolvedTheme === "dark" ? "light" : "dark";
      }
      if (prev === "darkHighContrast") return "lightHighContrast";
      if (prev === "lightHighContrast") return "darkHighContrast";
      return prev === "dark" ? "light" : "dark";
    });
  }, [resolvedTheme]);

  const toggleHighContrast = useCallback(() => {
    setHighContrast(!highContrast);
  }, [highContrast, setHighContrast]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolvedTheme,
      highContrast,
      setTheme,
      setHighContrast,
      toggleTheme,
      toggleHighContrast,
    }),
    [
      theme,
      resolvedTheme,
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
