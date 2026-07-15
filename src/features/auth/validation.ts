import { z } from "zod";

// Shared by the API routes (authoritative) and the RHF forms (inline feedback).

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[a-z]/, "Password must contain a lowercase letter")
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/[0-9]/, "Password must contain a number");

export const loginSchema = z.object({
  email: z.email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Please enter your full name"),
    email: z.email("Please enter a valid email address"),
    password: passwordSchema,
    confirmPassword: z.string(),
    registerNumber: z.string().trim().min(4, "Please enter your register number"),
    department: z.string().trim().min(2, "Please enter your department"),
    // Optional fields arrive as undefined (the form maps "" → undefined via setValueAs).
    semester: z
      .number("Semester must be a number")
      .int("Semester must be a whole number")
      .min(1, "Semester must be between 1 and 10")
      .max(10, "Semester must be between 1 and 10")
      .optional(),
    phoneNumber: z
      .string()
      .trim()
      .regex(/^[+\d][\d\s-]{6,17}$/, "Please enter a valid phone number")
      .optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
