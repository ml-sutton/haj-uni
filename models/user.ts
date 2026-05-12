import { z } from "zod";
import { medicationSchema } from "./medication";
import { noteSchema } from "./note";
import { securePreferencesSchema } from "./preferences";

const userSchema = z.object({
  username: z.string(),
  pronouns: z.array(z.string()),
  medications: z.array(medicationSchema),
  preferences: securePreferencesSchema,
  notes: z.array(noteSchema).default([]),
});

type User = z.infer<typeof userSchema>;

export function validateUser(data: unknown): User {
  return userSchema.parse(data);
}

export { type User };
