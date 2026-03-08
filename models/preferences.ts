import { z } from "zod";

const safePreferencesSchema = z.object({
  theme: z.enum(["light", "dark"]),
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
