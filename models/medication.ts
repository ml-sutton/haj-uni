import { z } from "zod";
import {
  dosageSchema,
  ingestionMethodSchema,
  medicationTypeSchema,
} from "./dosage";

export const medicationSchema = z.object({
  id: z.string(),
  name: z.string(),
  ingestionMethod: ingestionMethodSchema,
  medicationType: medicationTypeSchema,
  quantity: z.number(),
  refillAlertOn: z.boolean(),
  refillAlertQty: z.number(),
  dosages: z.array(dosageSchema),
});

export type Medication = z.infer<typeof medicationSchema>;

export function validateMedication(data: unknown): Medication {
  return medicationSchema.parse(data);
}
