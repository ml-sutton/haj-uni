/** Theme context, hooks, token types, and shared color helpers for the app shell. */
export { ThemeProvider, useTheme, useThemeOptional } from "./ThemeContext";
export type { ThemeProviderProps } from "./ThemeContext";
export type {
  ThemeMode,
  ResolvedTheme,
  HighContrast,
  ThemeState,
  ThemeActions,
  ThemeContextValue,
} from "./types";
export {
  ONBOARDING_GRADIENT,
  GRADIENT_START,
  GRADIENT_END,
  getGradientColors,
  primaryTextColor,
  secondaryTextColor,
  mutedTextColor,
  labelTextColor,
  valueTextColor,
  tabBarActiveTint,
  tabBarInactiveTint,
  tabBarBorderColor,
  titleBarIconBorderColor,
  cardBackgroundColor,
  inputBackgroundColor,
  inputBorderColor,
  PRIMARY_BUTTON_BG,
  ERROR_TEXT_COLOR,
} from "./onboardingStyles";
