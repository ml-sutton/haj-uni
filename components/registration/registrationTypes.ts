import type { SafePreferences, SecurePreferences } from "@/models/preferences";

export interface RegistrationFormData {
  username: string;
  pronouns: string[];
  safePreferences: SafePreferences;
  securePreferences: SecurePreferences;
  /** Ephemeral 24-word BIP39 phrase; cleared after account creation. Never persisted. */
  mnemonic: string;
  recoveryPhraseAcknowledged: boolean;
  pin: string;
}

export const DEFAULT_SAFE_PREFERENCES: SafePreferences = {
  theme: "system",
  discreteMode: false,
  selfDestructEnabled: false,
  quickExitEnabled: false,
  silentMode: false,
  notificationsEnabled: true,
  biometricEnabled: false,
};

export const DEFAULT_SECURE_PREFERENCES: SecurePreferences = {
  selfDestructAfterFailedAttempts: 5,
  lastRecoveryVerifiedAt: null,
  dosesPerDosage: 7,
};

export const DEFAULT_REGISTRATION_FORM_DATA: RegistrationFormData = {
  username: "",
  pronouns: [],
  safePreferences: DEFAULT_SAFE_PREFERENCES,
  securePreferences: DEFAULT_SECURE_PREFERENCES,
  mnemonic: "",
  recoveryPhraseAcknowledged: false,
  pin: "",
};

export const PIN_LENGTH = 6;
