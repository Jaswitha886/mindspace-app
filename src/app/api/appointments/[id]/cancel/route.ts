import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { apiError, fail, forbidden, notFound, ok } from "@/lib/api";

// Students cancel their own PENDING appointments only.
export async function PATCH(
  _request: NextRequest,
  ctx: RouteContext<"/api/appointments/[id]/cancel">,
) {
  try {
    const session = await requireRole("STUDENT");
    const { id } = await ctx.params;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      select: { id: true, studentId: true, counsellorId: true, status: true },
    });
    if (!appointment) return notFound("Appointment not found");
    if (appointment.studentId !== session.userId) {
      return forbidden("You can only cancel your own appointments");
    }
    if (appointment.status !== "PENDING") {
      return fail(
        `Cannot cancel appointment with status "${appointment.status}". Only pending appointments can be cancelled.`,
        400,
      );
    }

    const [updated] = await prisma.$transaction([
      prisma.appointment.update({
        where: { id },
        data: { status: "CANCELLED" },
        select: { id: true, status: true },
      }),
      prisma.notification.create({
        data: {
          recipientId: appointment.counsellorId,
          type: "APPOINTMENT_CANCELLED",
          payload: { appointmentId: id, studentName: session.name },
        },
      }),
    ]);

    return ok(
      { appointment: updated },
      { message: "Appointment cancelled successfully" },
    );
  } catch (error) {
    return apiError(error, "appointments.cancel");
  }
}
