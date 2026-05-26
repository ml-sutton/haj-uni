import { z } from "zod";

/**
 * Zod schema for a user-authored note stored in the encrypted profile.
 *
 * @property id - Stable unique identifier.
 * @property title - Short heading shown in lists.
 * @property body - Full note text (may be empty).
 * @property createdAt - ISO 8601 timestamp string when the note was created.
 */
export const noteSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  createdAt: z.string(),
});

/** Inferred TypeScript type for a validated {@link noteSchema} object. */
export type Note = z.infer<typeof noteSchema>;

/**
 * Parses and validates unknown input as a {@link Note}.
 *
 * @param data - Raw note object from storage.
 * @returns A validated {@link Note}.
 * @throws {z.ZodError} When validation fails.
 */
export function validateNote(data: unknown): Note {
  return noteSchema.parse(data);
}
