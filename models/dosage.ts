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

export const dosageSchema = z.object({
  id: z.string(),
  name: z.string(),
  frequencyDays: z.number(),
  dosage: z.number(),
  unit: unitSchema,
  notes: z.string().nullable(),
  ingestionMethod: ingestionMethodSchema,
  medicationType: medicationTypeSchema,
  doses: z.array(doseSchema),
});

export type MedicationType = z.infer<typeof medicationTypeSchema>;
export type IngestionMethod = z.infer<typeof ingestionMethodSchema>;
export type Dosage = z.infer<typeof dosageSchema>;

export function validateDosage(data: unknown): Dosage {
  return dosageSchema.parse(data);
}

export {
  medicationTypeSchema,
  ingestionMethodSchema,
};
