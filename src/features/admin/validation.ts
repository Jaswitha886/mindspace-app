import { z } from "zod";

export const userListQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  role: z.enum(["STUDENT", "COUNSELLOR", "ADMIN"]).optional(),
  status: z.enum(["active", "inactive"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const updateUserSchema = z
  .object({
    role: z.enum(["STUDENT", "COUNSELLOR", "ADMIN"]).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((v) => v.role !== undefined || v.isActive !== undefined, {
    message: "Nothing to update",
  });

/** Shared by the analytics endpoints: a date window plus an optional department. */
export const analyticsQuerySchema = z
  .object({
    from: z.iso.date().optional(),
    to: z.iso.date().optional(),
    departmentId: z.string().trim().min(1).optional(),
    groupBy: z.enum(["week", "month"]).default("week"),
  })
  .refine((v) => !v.from || !v.to || v.from <= v.to, {
    path: ["to"],
    message: "End date must be on or after the start date",
  });

export type AnalyticsQuery = z.infer<typeof analyticsQuerySchema>;
