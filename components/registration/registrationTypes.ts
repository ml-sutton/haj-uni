import type { SafePreferences, SecurePreferences } from "@/models/preferences";

/**
 * In-memory registration wizard payload accumulated across steps before persistence.
 */
export interface RegistrationFormData {
  /**
   * @param username - Chosen display name (trimmed before save).
   */
  username: string;
  /**
   * @param pronouns - Selected pronoun labels (optional multi-select).
   */
  pronouns: string[];
  /**
   * @param safePreferences - Non-encrypted preferences written to safe storage.
   */
  safePreferences: SafePreferences;
  /**
   * @param securePreferences - Encrypted user preferences stored with the account.
   */
  securePreferences: SecurePreferences;
  /**
   * @param mnemonic - Ephemeral 24-word BIP39 phrase; cleared after account creation. Never persisted in plain text.
   */
  mnemonic: string;
  /**
   * @param recoveryPhraseAcknowledged - User confirmed they saved the recovery phrase.
   */
  recoveryPhraseAcknowledged: boolean;
  /**
   * @param pin - Six-digit PIN used for registration and subsequent unlock.
   */
  pin: string;
}

/** Default safe preferences for a new registration. */
export const DEFAULT_SAFE_PREFERENCES: SafePreferences = {
  theme: "system",
  discreteMode: false,
  selfDestructEnabled: false,
  quickExitEnabled: false,
  silentMode: false,
  notificationsEnabled: true,
  biometricEnabled: false,
};

/** Default secure preferences for a new registration. */
export const DEFAULT_SECURE_PREFERENCES: SecurePreferences = {
  selfDestructAfterFailedAttempts: 5,
  lastRecoveryVerifiedAt: null,
  dosesPerDosage: 7,
};

/** Empty registration form state used when the wizard mounts. */
export const DEFAULT_REGISTRATION_FORM_DATA: RegistrationFormData = {
  username: "",
  pronouns: [],
  safePreferences: DEFAULT_SAFE_PREFERENCES,
  securePreferences: DEFAULT_SECURE_PREFERENCES,
  mnemonic: "",
  recoveryPhraseAcknowledged: false,
  pin: "",
};

/** Required number of digits for registration and login PIN entry. */
export const PIN_LENGTH = 6;
