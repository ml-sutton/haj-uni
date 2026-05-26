import { z } from "zod";

/**
 * Zod schema for a single scheduled dose instance under a dosage.
 *
 * @property id - Stable unique identifier.
 * @property scheduledTime - When the dose is due (coerced from ISO strings in JSON).
 * @property takenTime - When the user marked the dose taken, or `null` if still pending.
 */
export const doseSchema = z.object({
  id: z.string(),
  scheduledTime: z.coerce.date(),
  takenTime: z.coerce.date().nullable(),
});

/** Inferred TypeScript type for a validated {@link doseSchema} object. */
export type Dose = z.infer<typeof doseSchema>;

/**
 * Parses and validates unknown input as a {@link Dose}.
 *
 * @param data - Raw dose object from storage.
 * @returns A validated {@link Dose}.
 * @throws {z.ZodError} When validation fails.
 */
export function validateDose(data: unknown): Dose {
  return doseSchema.parse(data);
}
