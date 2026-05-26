import { z } from "zod";
import { medicationSchema } from "./medication";
import { noteSchema } from "./note";
import { securePreferencesSchema } from "./preferences";

/**
 * Zod schema for the encrypted user profile stored in the database.
 *
 * @property username - Display name chosen at registration.
 * @property pronouns - Selected pronoun labels (may include custom values).
 * @property medications - All tracked medications and their dosages/doses.
 * @property preferences - PIN-protected preference fields (self-destruct threshold, recovery, etc.).
 * @property notes - User-authored notes; defaults to an empty array when omitted in JSON.
 */
const userSchema = z.object({
  username: z.string(),
  pronouns: z.array(z.string()),
  medications: z.array(medicationSchema),
  preferences: securePreferencesSchema,
  notes: z.array(noteSchema).default([]),
});

/** Inferred TypeScript type for a validated {@link userSchema} object. */
type User = z.infer<typeof userSchema>;

/**
 * Parses and validates unknown input as a {@link User}.
 *
 * @param data - Raw JSON or object from storage or backup.
 * @returns A validated {@link User}.
 * @throws {z.ZodError} When the shape does not match {@link userSchema}.
 */
export function validateUser(data: unknown): User {
  return userSchema.parse(data);
}

export { type User };
