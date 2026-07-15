import { z } from "zod";

export const journalEntrySchema = z.object({
  title: z.string().trim().max(150, "Keep the title under 150 characters").optional(),
  content: z
    .string()
    .trim()
    .min(1, "Write something first")
    .max(20000, "Entry is too long"),
});

export type JournalEntryInput = z.infer<typeof journalEntrySchema>;
