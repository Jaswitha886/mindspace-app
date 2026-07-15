import { z } from "zod";

export const createMoodSchema = z.object({
  mood: z.enum(["HAPPY", "CALM", "NEUTRAL", "ANXIOUS", "SAD", "STRESSED"], {
    error: "Pick how you're feeling",
  }),
  note: z.string().trim().max(500, "Keep it under 500 characters").optional(),
});

export type CreateMoodInput = z.infer<typeof createMoodSchema>;
