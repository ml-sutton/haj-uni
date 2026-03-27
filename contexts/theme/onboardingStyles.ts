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

/** Gradient colors used during onboarding (getStarted, login, register). Applied app-wide. */
export const ONBOARDING_GRADIENT = {
  dark: ["#174A5E", "#333333"] as const,
  light: ["#F7DAF7", "#EBEBEB"] as const,
} as const;

export const GRADIENT_START = { x: 0.5, y: 0 } as const;
export const GRADIENT_END = { x: 0.5, y: 1 } as const;

/** Primary text (titles). */
export function primaryTextColor(
  theme: ResolvedTheme,
  overrides?: Partial<ThemeSnapshot>
): string {
  const { themeMode, highContrast } = getThemeSnapshot(overrides);
  if (highContrast) return theme === "dark" ? "#ffffff" : "#000000";
  if (themeMode === "colonthree") return COLONTHREE.text;
  return theme === "dark" ? "#fff" : "#1a1a1a";
}

/** Secondary text (subtitles, hints). */
export function secondaryTextColor(
  theme: ResolvedTheme,
  overrides?: Partial<ThemeSnapshot>
): string {
  const { themeMode, highContrast } = getThemeSnapshot(overrides);
  if (highContrast) return theme === "dark" ? "#ffffff" : "#000000";
  if (themeMode === "colonthree") return COLONTHREE.subtle;
  return theme === "dark" ? "rgba(255,255,255,0.9)" : "#444";
}

/** Muted secondary (captions). */
export function mutedTextColor(
  theme: ResolvedTheme,
  overrides?: Partial<ThemeSnapshot>
): string {
  const { themeMode, highContrast } = getThemeSnapshot(overrides);
  if (highContrast) return theme === "dark" ? "#ffffff" : "#000000";
  if (themeMode === "colonthree") return COLONTHREE.muted;
  return theme === "dark" ? "rgba(255,255,255,0.8)" : "#555";
}

/** Label text (form labels, card labels). */
export function labelTextColor(
  theme: ResolvedTheme,
  overrides?: Partial<ThemeSnapshot>
): string {
  const { themeMode, highContrast } = getThemeSnapshot(overrides);
  if (highContrast) return theme === "dark" ? "#ffffff" : "#000000";
  if (themeMode === "colonthree") return COLONTHREE.subtle;
  return theme === "dark" ? "rgba(255,255,255,0.85)" : "#555";
}

/** Value/body text. */
export function valueTextColor(
  theme: ResolvedTheme,
  overrides?: Partial<ThemeSnapshot>
): string {
  const { themeMode, highContrast } = getThemeSnapshot(overrides);
  if (highContrast) return theme === "dark" ? "#ffffff" : "#000000";
  if (themeMode === "colonthree") return COLONTHREE.text;
  return theme === "dark" ? "#fff" : "#333";
}

/** Error text. */
export const ERROR_TEXT_COLOR = "#e57373";

/** Primary button background (onboarding style). */
export const PRIMARY_BUTTON_BG = "#0066cc";

/** Get gradient colors array for the resolved theme. */
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

/** Tab bar: active icon/label tint. */
export function tabBarActiveTint(
  theme: ResolvedTheme,
  overrides?: Partial<ThemeSnapshot>
): string {
  const { themeMode, highContrast } = getThemeSnapshot(overrides);
  if (highContrast) return theme === "dark" ? "#ffffff" : "#000000";
  if (themeMode === "colonthree") return COLONTHREE.iris;
  return theme === "dark" ? "#c5e0f0" : "#174A5E";
}

/** Tab bar: inactive icon/label tint. */
export function tabBarInactiveTint(
  theme: ResolvedTheme,
  overrides?: Partial<ThemeSnapshot>
): string {
  const { themeMode, highContrast } = getThemeSnapshot(overrides);
  if (highContrast) return theme === "dark" ? "#ffffff" : "#000000";
  if (themeMode === "colonthree") return COLONTHREE.subtle;
  return theme === "dark" ? "rgba(255,255,255,0.75)" : "rgba(26,26,26,0.65)";
}

/** Tab bar / title bar top border color. */
export function tabBarBorderColor(
  theme: ResolvedTheme,
  overrides?: Partial<ThemeSnapshot>
): string {
  const { themeMode, highContrast } = getThemeSnapshot(overrides);
  if (highContrast) return theme === "dark" ? "#ffffff" : "#000000";
  if (themeMode === "colonthree") return COLONTHREE.highlightHigh;
  return theme === "dark" ? "rgba(255,255,255,0.4)" : "rgba(26,26,26,0.25)";
}

/** Title bar icon border (accent). */
export function titleBarIconBorderColor(
  theme: ResolvedTheme,
  overrides?: Partial<ThemeSnapshot>
): string {
  const { themeMode, highContrast } = getThemeSnapshot(overrides);
  if (highContrast) return theme === "dark" ? "#ffffff" : "#000000";
  if (themeMode === "colonthree") return COLONTHREE.iris;
  return theme === "dark" ? "#c5e0f0" : "#174A5E";
}

/** Card/section background on top of gradient. */
export function cardBackgroundColor(
  theme: ResolvedTheme,
  overrides?: Partial<ThemeSnapshot>
): string {
  const { themeMode, highContrast } = getThemeSnapshot(overrides);
  if (highContrast) return theme === "dark" ? "#000000" : "#ffffff";
  if (themeMode === "colonthree") return COLONTHREE.overlay;
  return theme === "dark" ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.85)";
}

/** Input background. */
export function inputBackgroundColor(
  theme: ResolvedTheme,
  overrides?: Partial<ThemeSnapshot>
): string {
  const { themeMode, highContrast } = getThemeSnapshot(overrides);
  if (highContrast) return theme === "dark" ? "#000000" : "#ffffff";
  if (themeMode === "colonthree") return COLONTHREE.surface;
  return theme === "dark" ? "rgba(255,255,255,0.12)" : "#fff";
}

/** Input border. */
export function inputBorderColor(
  theme: ResolvedTheme,
  overrides?: Partial<ThemeSnapshot>
): string {
  const { themeMode, highContrast } = getThemeSnapshot(overrides);
  if (highContrast) return theme === "dark" ? "#ffffff" : "#000000";
  if (themeMode === "colonthree") return COLONTHREE.highlightHigh;
  return theme === "dark" ? "rgba(255,255,255,0.3)" : "#ccc";
}
