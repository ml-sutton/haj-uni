/**
 * User-selectable theme preset, including system follow and high-contrast variants.
 * `"colonthree"` is a custom dark palette; `*HighContrast` map to stark black/white styling.
 */
export type ThemeMode =
  | "dark"
  | "light"
  | "system"
  | "colonthree"
  | "darkHighContrast"
  | "lightHighContrast";

/**
 * Resolved theme used for styling (always light or dark).
 */
export type ResolvedTheme = "dark" | "light";

/**
 * Whether high-contrast mode is enabled.
 */
export type HighContrast = boolean;

/**
 * Read-only theme state stored in context.
 */
export interface ThemeState {
  /**
   * @param theme - Active theme mode preset or `"system"`.
   */
  theme: ThemeMode;
  /**
   * @param resolvedTheme - Effective light or dark appearance used for colors (follows OS when theme is `"system"`).
   */
  resolvedTheme: ResolvedTheme;
  /**
   * @param highContrast - Whether a high-contrast preset is active.
   */
  highContrast: HighContrast;
}

/**
 * Actions to update theme state exposed by {@link ThemeProvider}.
 */
export interface ThemeActions {
  /**
   * @param theme - Next theme mode (preset, system, or high-contrast variant).
   */
  setTheme: (theme: ThemeMode) => void;
  /**
   * @param highContrast - When true, maps to `darkHighContrast` or `lightHighContrast` based on resolved appearance.
   */
  setHighContrast: (highContrast: HighContrast) => void;
  /** Toggles between dark and light resolved appearance (respects high-contrast variants). */
  toggleTheme: () => void;
  /** Toggles high-contrast on or off. */
  toggleHighContrast: () => void;
}

/**
 * Theme context value: state + actions. Memoized in provider.
 */
export type ThemeContextValue = ThemeState & ThemeActions;
