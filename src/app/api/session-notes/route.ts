import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { apiError, fail, forbidden, notFound, ok, validationError } from "@/lib/api";
import { createSessionNoteSchema } from "@/features/notes/validation";
import { escalateCritical, shouldEscalate } from "@/features/notes/escalation";

// Author a session note (counsellors only, own appointments only).
// Notes are visible to the authoring counsellor and admins — never the student.
export async function POST(request: Request) {
  try {
    const session = await requireRole("COUNSELLOR");

    const body = await request.json().catch(() => null);
    const parsed = createSessionNoteSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error);
    const input = parsed.data;

    const appointment = await prisma.appointment.findUnique({
      where: { id: input.appointmentId },
      select: {
        id: true,
        counsellorId: true,
        studentId: true,
        student: { select: { name: true } },
        sessionNote: { select: { id: true } },
      },
    });
    if (!appointment) return notFound("Appointment not found");
    if (appointment.counsellorId !== session.userId) return forbidden();
    if (appointment.sessionNote) {
      return fail("This appointment already has a note. Update it instead.", 409);
    }

    // The note, its notification, and its audit row commit together or not at
    // all — a CRITICAL note must never exist without its escalation.
    const note = await prisma.$transaction(async (tx) => {
      const created = await tx.sessionNote.create({
        data: {
          appointmentId: appointment.id,
          counsellorId: session.userId,
          content: input.notes,
          severity: input.severity,
        },
      });

      if (shouldEscalate(null, input.severity)) {
        await escalateCritical(tx, {
          noteId: created.id,
          appointmentId: appointment.id,
          counsellorId: session.userId,
          counsellorName: session.name,
          studentId: appointment.studentId,
        });
      }
      return created;
    });

    return ok(
      {
        note: {
          id: note.id,
          appointmentId: note.appointmentId,
          notes: note.content,
          severity: note.severity,
          createdAt: note.createdAt.toISOString(),
        },
      },
      {
        status: 201,
        message:
          input.severity === "CRITICAL"
            ? "Note saved. Admins have been notified of the critical flag."
            : "Note saved.",
      },
    );
  } catch (error) {
    return apiError(error, "sessionNotes.create");
  }
}
