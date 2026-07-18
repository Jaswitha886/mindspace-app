import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { apiError, fail, forbidden, notFound, ok } from "@/lib/api";

// "End session" — the counsellor closing a session they ran.
//
// This is the first code path that ever writes COMPLETED. Before it, the status
// was read by the appointment filter, the StatusChip, the counsellor schedule
// and the affirmation rule, but nothing set it: a session could never be done.
//
// Requires checkedInAt: a session that was never checked in has no evidence the
// student attended, so it cannot be "completed" — cancel it instead.
export async function PATCH(
  _request: NextRequest,
  ctx: RouteContext<"/api/appointments/[id]/complete">,
) {
  try {
    const session = await requireRole("COUNSELLOR");
    const { id } = await ctx.params;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      select: { id: true, counsellorId: true, status: true, checkedInAt: true },
    });
    if (!appointment) return notFound("Appointment not found");
    if (appointment.counsellorId !== session.userId) {
      return forbidden("You can only end your own sessions");
    }
    if (appointment.status !== "APPROVED") {
      return fail(
        `This session is ${appointment.status.toLowerCase()} and cannot be ended.`,
        400,
      );
    }
    if (!appointment.checkedInAt) {
      return fail(
        "Check the student in before ending the session — otherwise there's no record they attended.",
        400,
      );
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: { status: "COMPLETED" }, // checkedInAt is kept: it is the attendance record
      select: { id: true, status: true },
    });

    return ok({ appointment: updated }, { message: "Session ended" });
  } catch (error) {
    return apiError(error, "appointments.complete");
  }
}
