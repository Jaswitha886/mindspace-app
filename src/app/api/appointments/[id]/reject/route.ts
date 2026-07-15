import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { apiError, fail, forbidden, notFound, ok, validationError } from "@/lib/api";

// Per schema, Appointment.reason doubles as the counsellor's note when
// declining (e.g. a reschedule suggestion). Optional — a decline needn't
// justify itself, but the student sees it when given.
const rejectSchema = z.object({
  reason: z.string().trim().max(500, "Keep it under 500 characters").optional(),
});

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/appointments/[id]/reject">,
) {
  try {
    const session = await requireRole("COUNSELLOR");
    const { id } = await ctx.params;

    const body = await request.json().catch(() => ({}));
    const parsed = rejectSchema.safeParse(body ?? {});
    if (!parsed.success) return validationError(parsed.error);

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      select: { id: true, studentId: true, counsellorId: true, status: true },
    });
    if (!appointment) return notFound("Appointment not found");
    if (appointment.counsellorId !== session.userId) {
      return forbidden("You can only respond to your own appointment requests");
    }
    if (appointment.status !== "PENDING") {
      return fail(
        `Cannot decline appointment with status "${appointment.status}". Only pending requests can be declined.`,
        400,
      );
    }

    const [updated] = await prisma.$transaction([
      prisma.appointment.update({
        where: { id },
        data: {
          status: "REJECTED",
          ...(parsed.data.reason ? { reason: parsed.data.reason } : {}),
        },
        select: { id: true, status: true, reason: true },
      }),
      prisma.notification.create({
        data: {
          recipientId: appointment.studentId,
          type: "APPOINTMENT_REJECTED",
          payload: {
            appointmentId: id,
            counsellorName: session.name,
            ...(parsed.data.reason ? { reason: parsed.data.reason } : {}),
          },
        },
      }),
    ]);

    return ok({ appointment: updated }, { message: "Appointment declined" });
  } catch (error) {
    return apiError(error, "appointments.reject");
  }
}
