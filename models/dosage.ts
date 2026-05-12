import { z } from "zod";
import { doseSchema } from "./dose";

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

const medicationTypeSchema = z.enum(["Hormone", "Blocker", "Helper"]);
const ingestionMethodSchema = z.enum([
  "Oral",
  "Gel",
  "Patch",
  "Subcutaneous injection",
  "Intramuscular injection",
  "Other",
]);

/** Local clock time (hour + minute) for when a dose should recur. */
export const timeOfDaySchema = z.object({
  hour: z.number().int().min(0).max(23),
  minute: z.number().int().min(0).max(59),
});
export type TimeOfDay = z.infer<typeof timeOfDaySchema>;

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

export type MedicationType = z.infer<typeof medicationTypeSchema>;
export type IngestionMethod = z.infer<typeof ingestionMethodSchema>;
export type Dosage = z.infer<typeof dosageSchema>;

export function validateDosage(data: unknown): Dosage {
  return dosageSchema.parse(data);
}

export { medicationTypeSchema, ingestionMethodSchema };
