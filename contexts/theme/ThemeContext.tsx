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

/**
 * Props for {@link ThemeProvider}.
 */
export interface ThemeProviderProps {
  /**
   * @param children - App tree that receives theme context.
   */
  children: ReactNode;
  /**
   * @param initialTheme - Theme mode before user preferences load (defaults to `"system"`).
   */
  initialTheme?: ThemeMode;
}

/**
 * Supplies theme mode, resolved light/dark appearance, high-contrast flag, and update actions to descendants.
 * Syncs live theme snapshot for style helpers on each render.
 *
 * @param props - Provider children and optional initial theme.
 * @returns React context provider wrapping `children`.
 */
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
 * Reads theme state and actions from {@link ThemeProvider}.
 *
 * @returns Current {@link ThemeContextValue} (mode, resolved theme, high contrast, setters, toggles).
 * @throws If called outside a `ThemeProvider`.
 */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (ctx === null) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}

/**
 * Reads theme context when a provider may be absent (e.g. splash or storybook).
 *
 * @returns Live context value inside {@link ThemeProvider}, otherwise inert default state with no-op setters.
 */
export function useThemeOptional(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  return ctx ?? defaultState;
}
