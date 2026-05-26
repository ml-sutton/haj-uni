import type { HighContrast, ResolvedTheme, ThemeMode } from "./types";
import { getSafePreferences } from "@/stores/safePreferencesStore";

const COLONTHREE = {
  base: "#191724",
  surface: "#1f1d2e",
  overlay: "#26233a",
  muted: "#6e6a86",
  subtle: "#908caa",
  text: "#e0def4",
  love: "#eb6f92",
  gold: "#f6c177",
  rose: "#ebbcba",
  pine: "#31748f",
  foam: "#9ccfd8",
  iris: "#c4a7e7",
  highlightLow: "#21202e",
  highlightMed: "#403d52",
  highlightHigh: "#524f67",
} as const;

type ThemeSnapshot = {
  themeMode: ThemeMode;
  highContrast: HighContrast;
};

let liveThemeSnapshot: ThemeSnapshot = {
  themeMode: "system",
  highContrast: false,
};

/**
 * Updates the in-memory theme snapshot used by color helpers during the current render tree.
 * Called from {@link ThemeProvider} so style functions match context without reading preferences.
 *
 * @param snapshot - Current theme mode and high-contrast flag from the provider.
 * @returns Nothing.
 */
export function setLiveThemeSnapshot(snapshot: ThemeSnapshot): void {
  liveThemeSnapshot = snapshot;
}

function getThemeSnapshot(overrides?: Partial<ThemeSnapshot>): ThemeSnapshot {
  if (overrides?.themeMode || overrides?.highContrast !== undefined) {
    return {
      themeMode: overrides?.themeMode ?? liveThemeSnapshot.themeMode,
      highContrast: overrides?.highContrast ?? liveThemeSnapshot.highContrast,
    };
  }
  const prefs = getSafePreferences();
  const highContrastFromTheme =
    prefs.theme === "darkHighContrast" || prefs.theme === "lightHighContrast";
  return {
    themeMode: prefs.theme,
    highContrast: highContrastFromTheme,
  };
}

/**
 * Default vertical gradient color pairs for onboarding and main screens (not colonthree / high contrast).
 */
export const ONBOARDING_GRADIENT = {
  dark: ["#174A5E", "#333333"] as const,
  light: ["#F7DAF7", "#EBEBEB"] as const,
} as const;

/** `expo-linear-gradient` start point for vertical app gradients. */
export const GRADIENT_START = { x: 0.5, y: 0 } as const;
/** `expo-linear-gradient` end point for vertical app gradients. */
export const GRADIENT_END = { x: 0.5, y: 1 } as const;

/**
 * Primary text color for titles and prominent labels.
 *
 * @param theme - Resolved light or dark appearance.
 * @param overrides - Optional live theme mode / high-contrast overrides from context.
 * @returns CSS color string for primary text.
 */
export function primaryTextColor(
  theme: ResolvedTheme,
  overrides?: Partial<ThemeSnapshot>
): string {
  const { themeMode, highContrast } = getThemeSnapshot(overrides);
  if (highContrast) return theme === "dark" ? "#ffffff" : "#000000";
  if (themeMode === "colonthree") return COLONTHREE.text;
  return theme === "dark" ? "#fff" : "#1a1a1a";
}

/**
 * Secondary text color for subtitles and hints.
 *
 * @param theme - Resolved light or dark appearance.
 * @param overrides - Optional theme snapshot overrides.
 * @returns CSS color string for secondary text.
 */
export function secondaryTextColor(
  theme: ResolvedTheme,
  overrides?: Partial<ThemeSnapshot>
): string {
  const { themeMode, highContrast } = getThemeSnapshot(overrides);
  if (highContrast) return theme === "dark" ? "#ffffff" : "#000000";
  if (themeMode === "colonthree") return COLONTHREE.subtle;
  return theme === "dark" ? "rgba(255,255,255,0.9)" : "#444";
}

/**
 * Muted text color for captions and de-emphasized copy.
 *
 * @param theme - Resolved light or dark appearance.
 * @param overrides - Optional theme snapshot overrides.
 * @returns CSS color string for muted text.
 */
export function mutedTextColor(
  theme: ResolvedTheme,
  overrides?: Partial<ThemeSnapshot>
): string {
  const { themeMode, highContrast } = getThemeSnapshot(overrides);
  if (highContrast) return theme === "dark" ? "#ffffff" : "#000000";
  if (themeMode === "colonthree") return COLONTHREE.muted;
  return theme === "dark" ? "rgba(255,255,255,0.8)" : "#555";
}

/**
 * Label text color for form and card field labels.
 *
 * @param theme - Resolved light or dark appearance.
 * @param overrides - Optional theme snapshot overrides.
 * @returns CSS color string for labels.
 */
export function labelTextColor(
  theme: ResolvedTheme,
  overrides?: Partial<ThemeSnapshot>
): string {
  const { themeMode, highContrast } = getThemeSnapshot(overrides);
  if (highContrast) return theme === "dark" ? "#ffffff" : "#000000";
  if (themeMode === "colonthree") return COLONTHREE.subtle;
  return theme === "dark" ? "rgba(255,255,255,0.85)" : "#555";
}

/**
 * Value and body text color for emphasized content in lists and cards.
 *
 * @param theme - Resolved light or dark appearance.
 * @param overrides - Optional theme snapshot overrides.
 * @returns CSS color string for values and body text.
 */
export function valueTextColor(
  theme: ResolvedTheme,
  overrides?: Partial<ThemeSnapshot>
): string {
  const { themeMode, highContrast } = getThemeSnapshot(overrides);
  if (highContrast) return theme === "dark" ? "#ffffff" : "#000000";
  if (themeMode === "colonthree") return COLONTHREE.text;
  return theme === "dark" ? "#fff" : "#333";
}

/** Shared error message text color. */
export const ERROR_TEXT_COLOR = "#e57373";

/** Primary call-to-action button background used across onboarding and forms. */
export const PRIMARY_BUTTON_BG = "#0066cc";

/**
 * Resolves the two-stop gradient pair for backgrounds and footers.
 *
 * @param theme - Resolved light or dark appearance.
 * @param overrides - Optional theme snapshot overrides.
 * @returns Tuple of top and bottom gradient hex colors.
 */
export function getGradientColors(
  theme: ResolvedTheme,
  overrides?: Partial<ThemeSnapshot>
): readonly [string, string] {
  const { themeMode, highContrast } = getThemeSnapshot(overrides);
  if (highContrast) {
    return theme === "dark"
      ? (["#000000", "#000000"] as const)
      : (["#ffffff", "#ffffff"] as const);
  }
  if (themeMode === "colonthree") {
    return [COLONTHREE.base, COLONTHREE.surface] as const;
  }
  return theme === "dark" ? ONBOARDING_GRADIENT.dark : ONBOARDING_GRADIENT.light;
}

/**
 * Tab bar tint for the active route icon and label.
 *
 * @param theme - Resolved light or dark appearance.
 * @param overrides - Optional theme snapshot overrides.
 * @returns CSS color string for active tab items.
 */
export function tabBarActiveTint(
  theme: ResolvedTheme,
  overrides?: Partial<ThemeSnapshot>
): string {
  const { themeMode, highContrast } = getThemeSnapshot(overrides);
  if (highContrast) return theme === "dark" ? "#ffffff" : "#000000";
  if (themeMode === "colonthree") return COLONTHREE.iris;
  return theme === "dark" ? "#c5e0f0" : "#174A5E";
}

/**
 * Tab bar tint for inactive route icons and labels.
 *
 * @param theme - Resolved light or dark appearance.
 * @param overrides - Optional theme snapshot overrides.
 * @returns CSS color string for inactive tab items.
 */
export function tabBarInactiveTint(
  theme: ResolvedTheme,
  overrides?: Partial<ThemeSnapshot>
): string {
  const { themeMode, highContrast } = getThemeSnapshot(overrides);
  if (highContrast) return theme === "dark" ? "#ffffff" : "#000000";
  if (themeMode === "colonthree") return COLONTHREE.subtle;
  return theme === "dark" ? "rgba(255,255,255,0.75)" : "rgba(26,26,26,0.65)";
}

/**
 * Border color for tab bar and title bar separators.
 *
 * @param theme - Resolved light or dark appearance.
 * @param overrides - Optional theme snapshot overrides.
 * @returns CSS color string for horizontal borders.
 */
export function tabBarBorderColor(
  theme: ResolvedTheme,
  overrides?: Partial<ThemeSnapshot>
): string {
  const { themeMode, highContrast } = getThemeSnapshot(overrides);
  if (highContrast) return theme === "dark" ? "#ffffff" : "#000000";
  if (themeMode === "colonthree") return COLONTHREE.highlightHigh;
  return theme === "dark" ? "rgba(255,255,255,0.4)" : "rgba(26,26,26,0.25)";
}

/**
 * Accent border color around the title bar logo pressable.
 *
 * @param theme - Resolved light or dark appearance.
 * @param overrides - Optional theme snapshot overrides.
 * @returns CSS color string for the logo border.
 */
export function titleBarIconBorderColor(
  theme: ResolvedTheme,
  overrides?: Partial<ThemeSnapshot>
): string {
  const { themeMode, highContrast } = getThemeSnapshot(overrides);
  if (highContrast) return theme === "dark" ? "#ffffff" : "#000000";
  if (themeMode === "colonthree") return COLONTHREE.iris;
  return theme === "dark" ? "#c5e0f0" : "#174A5E";
}

/**
 * Semi-opaque card and section background on top of screen gradients.
 *
 * @param theme - Resolved light or dark appearance.
 * @param overrides - Optional theme snapshot overrides.
 * @returns CSS color string for card surfaces.
 */
export function cardBackgroundColor(
  theme: ResolvedTheme,
  overrides?: Partial<ThemeSnapshot>
): string {
  const { themeMode, highContrast } = getThemeSnapshot(overrides);
  if (highContrast) return theme === "dark" ? "#000000" : "#ffffff";
  if (themeMode === "colonthree") return COLONTHREE.overlay;
  return theme === "dark" ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.85)";
}

/**
 * Text input and form control background color.
 *
 * @param theme - Resolved light or dark appearance.
 * @param overrides - Optional theme snapshot overrides.
 * @returns CSS color string for input backgrounds.
 */
export function inputBackgroundColor(
  theme: ResolvedTheme,
  overrides?: Partial<ThemeSnapshot>
): string {
  const { themeMode, highContrast } = getThemeSnapshot(overrides);
  if (highContrast) return theme === "dark" ? "#000000" : "#ffffff";
  if (themeMode === "colonthree") return COLONTHREE.surface;
  return theme === "dark" ? "rgba(255,255,255,0.12)" : "#fff";
}

/**
 * Text input and form control border color.
 *
 * @param theme - Resolved light or dark appearance.
 * @param overrides - Optional theme snapshot overrides.
 * @returns CSS color string for input borders.
 */
export function inputBorderColor(
  theme: ResolvedTheme,
  overrides?: Partial<ThemeSnapshot>
): string {
  const { themeMode, highContrast } = getThemeSnapshot(overrides);
  if (highContrast) return theme === "dark" ? "#ffffff" : "#000000";
  if (themeMode === "colonthree") return COLONTHREE.highlightHigh;
  return theme === "dark" ? "rgba(255,255,255,0.3)" : "#ccc";
}
