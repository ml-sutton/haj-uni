import { z } from "zod";

export const noteSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  createdAt: z.string(),
});

export type Note = z.infer<typeof noteSchema>;

export function validateNote(data: unknown): Note {
  return noteSchema.parse(data);
}
