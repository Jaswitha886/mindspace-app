import { z } from "zod";

export const severitySchema = z.enum(["MILD", "MODERATE", "CRITICAL"]);

export const createSessionNoteSchema = z.object({
  appointmentId: z.string().min(1, "Appointment is required"),
  notes: z
    .string()
    .trim()
    .min(1, "Write your observations before saving")
    .max(5000, "Keep it under 5000 characters"),
  severity: severitySchema.default("MILD"),
});

export const updateSessionNoteSchema = z.object({
  notes: z
    .string()
    .trim()
    .min(1, "Write your observations before saving")
    .max(5000, "Keep it under 5000 characters")
    .optional(),
  severity: severitySchema.optional(),
});

export type CreateSessionNoteInput = z.infer<typeof createSessionNoteSchema>;
export type UpdateSessionNoteInput = z.infer<typeof updateSessionNoteSchema>;
