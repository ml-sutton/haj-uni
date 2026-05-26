import { z } from "zod";

/**
 * Zod schema for preferences stored without encryption (safe partition).
 *
 * @property theme - App color theme identifier, including high-contrast and easter-egg variants.
 * @property discreteMode - When true, UI and notifications use neutral/discrete copy.
 * @property selfDestructEnabled - Whether failed PIN attempts can wipe local data.
 * @property quickExitEnabled - Whether shake-to-exit and related quick-exit features are allowed.
 * @property silentMode - Suppresses non-critical feedback when enabled.
 * @property notificationsEnabled - Master switch for dose reminder notifications.
 * @property biometricEnabled - Whether biometric unlock may cache the encryption key.
 */
const safePreferencesSchema = z.object({
  theme: z.enum([
    "light",
    "dark",
    "system",
    "colonthree",
    "lightHighContrast",
    "darkHighContrast",
  ]),
  discreteMode: z.boolean(),
  selfDestructEnabled: z.boolean(),
  quickExitEnabled: z.boolean(),
  silentMode: z.boolean(),
  notificationsEnabled: z.boolean(),
  biometricEnabled: z.boolean(),
});

/**
 * Zod schema for preferences stored inside the encrypted user blob.
 *
 * @property selfDestructAfterFailedAttempts - PIN failures before self-destruct runs (when enabled).
 * @property lastRecoveryVerifiedAt - Last time the user confirmed their recovery phrase, or `null`.
 * @property dosesPerDosage - Default number of scheduled doses created per new dosage (1–999).
 */
const securePreferencesSchema = z.object({
  selfDestructAfterFailedAttempts: z.number(),
  lastRecoveryVerifiedAt: z.coerce.date().nullable(),
  /** Number of doses to create when creating a new dosage. Long-press save = 1 one-off dose. */
  dosesPerDosage: z.number().min(1).max(999).default(7),
});

/** Non-sensitive app settings (theme, privacy toggles, notification/biometric flags). */
type SafePreferences = z.infer<typeof safePreferencesSchema>;

/** Sensitive settings persisted only inside the encrypted user record. */
type SecurePreferences = z.infer<typeof securePreferencesSchema>;

/**
 * Parses and validates unknown input as {@link SafePreferences}.
 *
 * @param data - Raw JSON or object from the safe storage partition.
 * @returns Validated {@link SafePreferences}.
 * @throws {z.ZodError} When validation fails.
 */
export function validateSafePreferences(data: unknown): SafePreferences {
  return safePreferencesSchema.parse(data);
}

/**
 * Parses and validates unknown input as {@link SecurePreferences}.
 *
 * @param data - Raw preferences object (typically nested under user data).
 * @returns Validated {@link SecurePreferences}.
 * @throws {z.ZodError} When validation fails.
 */
export function validateSecurePreferences(data: unknown): SecurePreferences {
  return securePreferencesSchema.parse(data);
}

export { safePreferencesSchema, securePreferencesSchema, type SafePreferences, type SecurePreferences };
