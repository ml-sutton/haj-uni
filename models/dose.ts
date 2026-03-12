import { z } from "zod";

export const doseSchema = z.object({
  id: z.string(),
  scheduledTime: z.coerce.date(),
  takenTime: z.coerce.date().nullable(),
});

export type Dose = z.infer<typeof doseSchema>;

export function validateDose(data: unknown): Dose {
  return doseSchema.parse(data);
}
