import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { apiError, notFound, ok, validationError } from "@/lib/api";

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD.");
const updateSchema = z
  .object({
    reason: z.string().trim().min(1).max(2000),
    startDate: date,
    endDate: date,
    notes: z.string().trim().max(5000).optional().or(z.literal("")),
    status: z.enum(["ACTIVE", "COMPLETED", "CANCELLED"]),
  })
  .refine((value) => value.endDate >= value.startDate, {
    path: ["endDate"],
    message: "End date must be on or after the start date.",
  });

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireRole("ADMIN");
    const { id } = await context.params;
    const parsed = updateSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return validationError(parsed.error);
    const input = parsed.data;
    const updated = await prisma.suspension.updateMany({
      where: { id },
      data: {
        reason: input.reason,
        startDate: new Date(`${input.startDate}T00:00:00.000Z`),
        endDate: new Date(`${input.endDate}T00:00:00.000Z`),
        notes: input.notes || null,
        status: input.status,
      },
    });
    if (updated.count === 0) return notFound("Suspension not found");
    return ok({ updated: true }, { message: "Suspension updated." });
  } catch (error) {
    return apiError(error, "admin.suspensions.update");
  }
}
