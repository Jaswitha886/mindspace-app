import { z } from "zod";

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

export const bookAppointmentSchema = z
  .object({
    counsellorId: z.string().min(1, "Please select a counsellor"),
    date: z.iso.date("Date is required"),
    startTime: z.string().regex(timePattern, "Pick a time slot"),
    endTime: z.string().regex(timePattern, "Pick a time slot"),
    reason: z.string().trim().max(500, "Keep it under 500 characters").optional(),
  })
  .refine((v) => v.startTime < v.endTime, {
    path: ["endTime"],
    message: "End time must be after start time",
  });

export type BookAppointmentInput = z.infer<typeof bookAppointmentSchema>;

export const appointmentListQuerySchema = z.object({
  status: z
    .enum(["PENDING", "APPROVED", "REJECTED", "CANCELLED", "COMPLETED"])
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});
