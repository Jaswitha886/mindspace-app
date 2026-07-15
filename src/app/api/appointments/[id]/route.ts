import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { apiError, forbidden, notFound, ok } from "@/lib/api";
import {
  appointmentInclude,
  serializeAppointment,
} from "@/features/appointments/serialize";

// Full details — owning student or assigned counsellor only. The session note
// is included only for the counsellor; students never see note content.
export async function GET(
  _request: NextRequest,
  ctx: RouteContext<"/api/appointments/[id]">,
) {
  try {
    const session = await requireAuth();
    const { id } = await ctx.params;

    const row = await prisma.appointment.findUnique({
      where: { id },
      include: {
        ...appointmentInclude,
        sessionNote: {
          select: { content: true, severity: true, createdAt: true },
        },
      },
    });
    if (!row) return notFound("Appointment not found");

    const isOwningStudent =
      session.role === "STUDENT" && row.studentId === session.userId;
    const isAssignedCounsellor =
      session.role === "COUNSELLOR" && row.counsellorId === session.userId;
    if (!isOwningStudent && !isAssignedCounsellor) return forbidden();

    const { sessionNote, ...appointment } = row;
    return ok({
      appointment: {
        ...serializeAppointment(appointment),
        sessionNote:
          isAssignedCounsellor && sessionNote
            ? {
                notes: sessionNote.content,
                severity: sessionNote.severity,
                createdAt: sessionNote.createdAt.toISOString(),
              }
            : null,
      },
    });
  } catch (error) {
    return apiError(error, "appointments.detail");
  }
}
