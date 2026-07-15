import { z } from "zod";

// Email is tied to auth and deliberately not editable here.
export const studentProfileSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name"),
  phoneNumber: z
    .string()
    .trim()
    .regex(/^[+\d][\d\s-]{6,17}$/, "Please enter a valid phone number")
    .optional(),
  semester: z
    .number("Semester must be a number")
    .int("Semester must be a whole number")
    .min(1, "Semester must be between 1 and 10")
    .max(10, "Semester must be between 1 and 10")
    .optional(),
});

export type StudentProfileInput = z.infer<typeof studentProfileSchema>;

// Counsellors may change their email (Phase 3), unlike students. Role is
// absent by design: it is admin-controlled and view-only here — a counsellor
// must not be able to promote themselves by POSTing a role field.
export const counsellorProfileSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name"),
  email: z.email("Please enter a valid email address"),
  contactNumber: z
    .string()
    .trim()
    .regex(/^[+\d][\d\s-]{6,17}$/, "Please enter a valid phone number")
    .optional(),
  yearsOfExperience: z
    .number("Years of experience must be a number")
    .int("Years of experience must be a whole number")
    .min(0, "Years of experience cannot be negative")
    .max(60, "Please enter a realistic number of years")
    .optional(),
});

export type CounsellorProfileInput = z.infer<typeof counsellorProfileSchema>;
