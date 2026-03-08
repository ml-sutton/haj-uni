import { z } from "zod";
import { doseSchema } from "./dose";
import { securePreferencesSchema } from "./preferences";

const userSchema = z.object({
  username: z.string(),
  pronouns: z.array(z.string()),
  doses: z.array(doseSchema),
  preferences: securePreferencesSchema,
});

type User = z.infer<typeof userSchema>;

export function validateUser(data: unknown): User {
  return userSchema.parse(data);
}

export { type User };
