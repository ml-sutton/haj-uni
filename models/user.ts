import { z } from "zod";
import { dosageSchema } from "./dosage";
import { noteSchema } from "./note";
import { securePreferencesSchema } from "./preferences";

const userSchema = z.object({
  username: z.string(),
  pronouns: z.array(z.string()),
  dosages: z.array(dosageSchema),
  preferences: securePreferencesSchema,
  notes: z.array(noteSchema).default([]),
});

type User = z.infer<typeof userSchema>;

export function validateUser(data: unknown): User {
  return userSchema.parse(data);
}

export { type User };
