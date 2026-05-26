import { z } from "zod";
import { doseSchema } from "./dose";

/**
 * Unit of measure for a dosage amount (e.g. mg, patch, IU).
 *
 * @remarks
 * `"Other"` is used when the prescriber's unit does not match a built-in option.
 */
export const unitSchema = z.enum([
  "mg",
  "mL",
  "mcg",
  "g",
  "IU",
  "patch",
  "Other",
]);
export type Unit = z.infer<typeof unitSchema>;

/** High-level medication category used for filtering and display. */
const medicationTypeSchema = z.enum(["Hormone", "Blocker", "Helper"]);

/** Route or form of administration for a medication. */
const ingestionMethodSchema = z.enum([
  "Oral",
  "Gel",
  "Patch",
  "Subcutaneous injection",
  "Intramuscular injection",
  "Other",
]);

/**
 * Local clock time (hour and minute) for when a dose should recur within a period.
 *
 * @property hour - 0–23 in local time.
 * @property minute - 0–59 in local time.
 */
export const timeOfDaySchema = z.object({
  hour: z.number().int().min(0).max(23),
  minute: z.number().int().min(0).max(59),
});
export type TimeOfDay = z.infer<typeof timeOfDaySchema>;

/**
 * Zod schema for a recurring dosage schedule attached to a medication.
 *
 * @property id - Stable unique identifier.
 * @property timesOfDay - One or more clock times per period when this amount applies (e.g. morning and evening).
 * @property amount - Numeric dose amount in {@link Unit}.
 * @property unit - Unit for {@link amount}.
 * @property frequencyDays - Interval in days between dose periods (minimum 1).
 * @property notes - Optional user notes for this schedule, or `null`.
 * @property doses - Concrete scheduled dose instances generated from this dosage.
 */
export const dosageSchema = z.object({
  id: z.string(),
  /** All clock times each period when this amount applies (e.g. morning + evening). */
  timesOfDay: z.array(timeOfDaySchema).min(1),
  amount: z.number(),
  unit: unitSchema,
  frequencyDays: z.number().int().min(1),
  notes: z.string().nullable(),
  doses: z.array(doseSchema),
});

/** Medication category: hormone, blocker, or helper. */
export type MedicationType = z.infer<typeof medicationTypeSchema>;

/** How the medication is administered (oral, gel, patch, injections, etc.). */
export type IngestionMethod = z.infer<typeof ingestionMethodSchema>;

/** Inferred TypeScript type for a validated {@link dosageSchema} object. */
export type Dosage = z.infer<typeof dosageSchema>;

/**
 * Parses and validates unknown input as a {@link Dosage}.
 *
 * @param data - Raw dosage object from storage.
 * @returns A validated {@link Dosage}.
 * @throws {z.ZodError} When validation fails.
 */
export function validateDosage(data: unknown): Dosage {
  return dosageSchema.parse(data);
}

export { medicationTypeSchema, ingestionMethodSchema };
