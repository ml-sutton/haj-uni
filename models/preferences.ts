import { z } from "zod";

const safePreferencesSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
  highContrast: z.boolean(),
  discreteMode: z.boolean(),
  quickExitEnabled: z.boolean(),
  silentMode: z.boolean(),
  notificationsEnabled: z.boolean(),
  biometricEnabled: z.boolean(),
});

const securePreferencesSchema = z.object({
  selfDestructAfterFailedAttempts: z.number(),
  lastRecoveryVerifiedAt: z.coerce.date().nullable(),
  /** Number of doses to create when creating a new dosage. Long-press save = 1 one-off dose. */
  dosesPerDosage: z.number().min(1).max(999).default(7),
});

type SafePreferences = z.infer<typeof safePreferencesSchema>;
type SecurePreferences = z.infer<typeof securePreferencesSchema>;

export function validateSafePreferences(data: unknown): SafePreferences {
  return safePreferencesSchema.parse(data);
}

export function validateSecurePreferences(data: unknown): SecurePreferences {
  return securePreferencesSchema.parse(data);
}

export { safePreferencesSchema, securePreferencesSchema,type SafePreferences, type SecurePreferences };
