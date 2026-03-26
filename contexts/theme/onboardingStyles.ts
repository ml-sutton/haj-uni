import type { ResolvedTheme } from "./types";
import { getSafePreferences } from "@/stores/safePreferencesStore";

function isHighContrastEnabled(): boolean {
  return getSafePreferences().highContrast;
}

/** Gradient colors used during onboarding (getStarted, login, register). Applied app-wide. */
export const ONBOARDING_GRADIENT = {
  dark: ["#174A5E", "#333333"] as const,
  light: ["#F7DAF7", "#EBEBEB"] as const,
} as const;

export const GRADIENT_START = { x: 0.5, y: 0 } as const;
export const GRADIENT_END = { x: 0.5, y: 1 } as const;

/** Primary text (titles). */
export function primaryTextColor(theme: ResolvedTheme): string {
  if (isHighContrastEnabled()) {
    return theme === "dark" ? "#ffffff" : "#000000";
  }
  return theme === "dark" ? "#fff" : "#1a1a1a";
}

/** Secondary text (subtitles, hints). */
export function secondaryTextColor(theme: ResolvedTheme): string {
  if (isHighContrastEnabled()) {
    return theme === "dark" ? "#f2f2f2" : "#111111";
  }
  return theme === "dark" ? "rgba(255,255,255,0.9)" : "#444";
}

/** Muted secondary (captions). */
export function mutedTextColor(theme: ResolvedTheme): string {
  if (isHighContrastEnabled()) {
    return theme === "dark" ? "#ebebeb" : "#1a1a1a";
  }
  return theme === "dark" ? "rgba(255,255,255,0.8)" : "#555";
}

/** Label text (form labels, card labels). */
export function labelTextColor(theme: ResolvedTheme): string {
  if (isHighContrastEnabled()) {
    return theme === "dark" ? "#ffffff" : "#0a0a0a";
  }
  return theme === "dark" ? "rgba(255,255,255,0.85)" : "#555";
}

/** Value/body text. */
export function valueTextColor(theme: ResolvedTheme): string {
  if (isHighContrastEnabled()) {
    return theme === "dark" ? "#ffffff" : "#000000";
  }
  return theme === "dark" ? "#fff" : "#333";
}

/** Error text. */
export const ERROR_TEXT_COLOR = "#e57373";

/** Primary button background (onboarding style). */
export const PRIMARY_BUTTON_BG = "#0066cc";

/** Get gradient colors array for the resolved theme. */
export function getGradientColors(theme: ResolvedTheme): readonly [string, string] {
  return theme === "dark" ? ONBOARDING_GRADIENT.dark : ONBOARDING_GRADIENT.light;
}

/** Tab bar: active icon/label tint. */
export function tabBarActiveTint(theme: ResolvedTheme): string {
  if (isHighContrastEnabled()) {
    return theme === "dark" ? "#ffffff" : "#000000";
  }
  return theme === "dark" ? "#c5e0f0" : "#174A5E";
}

/** Tab bar: inactive icon/label tint. */
export function tabBarInactiveTint(theme: ResolvedTheme): string {
  if (isHighContrastEnabled()) {
    return theme === "dark" ? "#ffffff" : "#000000";
  }
  return theme === "dark" ? "rgba(255,255,255,0.75)" : "rgba(26,26,26,0.65)";
}

/** Tab bar / title bar top border color. */
export function tabBarBorderColor(theme: ResolvedTheme): string {
  if (isHighContrastEnabled()) {
    return theme === "dark" ? "#ffffff" : "#000000";
  }
  return theme === "dark" ? "rgba(255,255,255,0.4)" : "rgba(26,26,26,0.25)";
}

/** Title bar icon border (accent). */
export function titleBarIconBorderColor(theme: ResolvedTheme): string {
  if (isHighContrastEnabled()) {
    return theme === "dark" ? "#ffffff" : "#000000";
  }
  return theme === "dark" ? "#c5e0f0" : "#174A5E";
}

/** Card/section background on top of gradient. */
export function cardBackgroundColor(theme: ResolvedTheme): string {
  if (isHighContrastEnabled()) {
    return theme === "dark" ? "rgba(0,0,0,0.7)" : "#ffffff";
  }
  return theme === "dark" ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.85)";
}

/** Input background. */
export function inputBackgroundColor(theme: ResolvedTheme): string {
  if (isHighContrastEnabled()) {
    return theme === "dark" ? "#000000" : "#ffffff";
  }
  return theme === "dark" ? "rgba(255,255,255,0.12)" : "#fff";
}

/** Input border. */
export function inputBorderColor(theme: ResolvedTheme): string {
  if (isHighContrastEnabled()) {
    return theme === "dark" ? "#ffffff" : "#000000";
  }
  return theme === "dark" ? "rgba(255,255,255,0.3)" : "#ccc";
}
