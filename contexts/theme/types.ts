/**
 * Theme mode: dark, light, or follow system.
 */
export type ThemeMode = "dark" | "light" | "system";

/**
 * Resolved theme used for styling (always light or dark).
 */
export type ResolvedTheme = "dark" | "light";

/**
 * Whether high-contrast mode is enabled.
 */
export type HighContrast = boolean;

/**
 * Full theme state stored in context.
 */
export interface ThemeState {
  theme: ThemeMode;
  /** Resolved theme for styling; follows system when theme is "system". */
  resolvedTheme: ResolvedTheme;
  highContrast: HighContrast;
}

/**
 * Actions to update theme state. All fields optional for partial updates.
 */
export interface ThemeActions {
  setTheme: (theme: ThemeMode) => void;
  setHighContrast: (highContrast: HighContrast) => void;
  /** Toggle between dark and light. */
  toggleTheme: () => void;
  /** Toggle high-contrast on/off. */
  toggleHighContrast: () => void;
}

/**
 * Theme context value: state + actions. Memoized in provider.
 */
export type ThemeContextValue = ThemeState & ThemeActions;
