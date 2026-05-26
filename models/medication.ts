import { z } from "zod";
import {
  dosageSchema,
  ingestionMethodSchema,
  medicationTypeSchema,
} from "./dosage";

/**
 * Zod schema for a medication the user tracks (supply, alerts, and dosage schedules).
 *
 * @property id - Stable unique identifier.
 * @property name - User-visible medication label.
 * @property ingestionMethod - How the medication is taken (oral, patch, injection, etc.).
 * @property medicationType - Category: hormone, blocker, or helper.
 * @property quantity - Remaining units on hand (decremented when a dose is marked taken).
 * @property refillAlertOn - Whether low-supply alerts are enabled.
 * @property refillAlertQty - Threshold quantity that triggers a refill alert.
 * @property dosages - One or more recurring dosage definitions with scheduled doses.
 */
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

/** Inferred TypeScript type for a validated {@link medicationSchema} object. */
export type Medication = z.infer<typeof medicationSchema>;

/**
 * Parses and validates unknown input as a {@link Medication}.
 *
 * @param data - Raw medication object from storage or API.
 * @returns A validated {@link Medication}.
 * @throws {z.ZodError} When the shape does not match {@link medicationSchema}.
 */
export function validateMedication(data: unknown): Medication {
  return medicationSchema.parse(data);
}
