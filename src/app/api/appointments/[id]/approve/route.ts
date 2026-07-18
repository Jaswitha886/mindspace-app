import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { apiError, fail, forbidden, notFound, ok } from "@/lib/api";
import { syncCalendarEvent } from "@/features/google-calendar/sync-calendar";

// Counsellors approve their own PENDING requests only.
// No slot re-check is needed here: PENDING already blocks the slot
// (SLOT_BLOCKING_STATUSES), so an approvable request cannot be double-booked.
export async function PATCH(
  _request: NextRequest,
  ctx: RouteContext<"/api/appointments/[id]/approve">,
) {
  try {
    const session = await requireRole("COUNSELLOR");
    const { id } = await ctx.params;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      select: {
        id: true,
        studentId: true,
        counsellorId: true,
        status: true,
        appointmentDate: true,
        startTime: true,
      },
    });
    if (!appointment) return notFound("Appointment not found");
    if (appointment.counsellorId !== session.userId) {
      return forbidden("You can only respond to your own appointment requests");
    }
    if (appointment.status !== "PENDING") {
      return fail(
        `Cannot approve appointment with status "${appointment.status}". Only pending requests can be approved.`,
        400,
      );
    }

    const [updated] = await prisma.$transaction([
      prisma.appointment.update({
        where: { id },
        data: { status: "APPROVED" },
        select: { id: true, status: true },
      }),
      prisma.notification.create({
        data: {
          recipientId: appointment.studentId,
          type: "APPOINTMENT_APPROVED",
          payload: {
            appointmentId: id,
            counsellorName: session.name,
            date: appointment.appointmentDate.toISOString().slice(0, 10),
            startTime: appointment.startTime,
          },
        },
      }),
    ]);

    // Sync to Google Calendar (non-blocking — don't await in production,
    // but we await here for simplicity; a background queue is better at scale).
    syncCalendarEvent(id).catch(console.error);

    return ok({ appointment: updated }, { message: "Appointment confirmed" });
  } catch (error) {
    return apiError(error, "appointments.approve");
  }
}
