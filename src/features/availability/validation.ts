import { z } from "zod";

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

// Working hours are 09:00–17:00 (schema comment on Availability.startTime).
export const WORK_START = "09:00";
export const WORK_END = "17:00";

export const availabilitySchema = z
  .object({
    isRecurring: z.boolean().default(true),
    dayOfWeek: z.number().int().min(0).max(6).nullable().optional(),
    specificDate: z.iso.date().nullable().optional(),
    startTime: z.string().regex(timePattern, "Pick a start time"),
    endTime: z.string().regex(timePattern, "Pick an end time"),
  })
  .refine((v) => v.startTime < v.endTime, {
    path: ["endTime"],
    message: "End time must be after start time",
  })
  .refine((v) => v.startTime >= WORK_START && v.endTime <= WORK_END, {
    path: ["startTime"],
    message: `Slots must fall within ${WORK_START}–${WORK_END}`,
  })
  // A window is recurring (a weekday) or one-off (a date) — never both, never
  // neither, or getSlotsForDate() can't match it.
  .refine((v) => (v.isRecurring ? v.dayOfWeek != null : !!v.specificDate), {
    path: ["isRecurring"],
    message: "Recurring slots need a weekday; one-off slots need a date",
  });

export const updateAvailabilitySchema = z.object({
  isActive: z.boolean(),
});

export type AvailabilityInput = z.infer<typeof availabilitySchema>;
