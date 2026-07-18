import { z } from "zod";

// User-management schemas (userListQuerySchema, updateUserSchema) were removed
// with the Users page: the admin is analytics-only now and manages no accounts.

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
