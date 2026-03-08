import { z } from "zod";

const medicationTypeSchema = z.enum(["Hormone", "Blocker", "Helper"]);
const ingestionMethodSchema = z.enum([
  "Oral",
  "Gel",
  "Patch",
  "Subcutaneous injection",
  "Intramuscular injection",
  "Other",
]);

export const doseSchema = z.object({
  scheduledTime: z.coerce.date(),
  takenTime: z.coerce.date().nullable(),
  notes: z.string().nullable(),
  medication: z.string(),
  dosage: z.number(),
  unit: z.string(),
  medicationType: medicationTypeSchema,
  ingestionMethod: ingestionMethodSchema,
  frequency: z.number(),
});

type Dose = z.infer<typeof doseSchema>;
type MedicationType = z.infer<typeof medicationTypeSchema>;
type IngestionMethod = z.infer<typeof ingestionMethodSchema>;

export function validateDose(data: unknown): Dose {
  return doseSchema.parse(data);
}

export {
  type Dose,
  type IngestionMethod,
  type MedicationType,
};
