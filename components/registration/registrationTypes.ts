import type { SafePreferences, SecurePreferences } from "@/models/preferences";

export interface RegistrationFormData {
  username: string;
  pronouns: string[];
  safePreferences: SafePreferences;
  securePreferences: SecurePreferences;
  pin: string;
}

export const DEFAULT_SAFE_PREFERENCES: SafePreferences = {
  theme: "system",
  highContrast: false,
  discreteMode: false,
  quickExitEnabled: false,
  silentMode: false,
  notificationsEnabled: true,
  biometricEnabled: false,
};

export const DEFAULT_SECURE_PREFERENCES: SecurePreferences = {
  selfDestructAfterFailedAttempts: 5,
  lastRecoveryVerifiedAt: null,
};

export const DEFAULT_REGISTRATION_FORM_DATA: RegistrationFormData = {
  username: "",
  pronouns: [],
  safePreferences: DEFAULT_SAFE_PREFERENCES,
  securePreferences: DEFAULT_SECURE_PREFERENCES,
  pin: "",
};

export const PRONOUN_OPTIONS: readonly string[] = [
  "he/him",
  "she/her",
  "they/them",
  "xe/xem",
  "ze/zir",
  "other",
] as const;

export type PronounOption = (typeof PRONOUN_OPTIONS)[number];

export const PIN_LENGTH = 6;
