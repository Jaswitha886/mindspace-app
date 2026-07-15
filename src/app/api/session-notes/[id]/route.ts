import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { apiError, forbidden, notFound, ok, validationError } from "@/lib/api";
import { updateSessionNoteSchema } from "@/features/notes/validation";
import { escalateCritical, shouldEscalate } from "@/features/notes/escalation";

// Update a session note. Only the authoring counsellor may edit it.
// Raising severity to CRITICAL escalates exactly as a fresh CRITICAL note does.
export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/session-notes/[id]">,
) {
  try {
    const session = await requireRole("COUNSELLOR");
    const { id } = await ctx.params;

    const body = await request.json().catch(() => null);
    const parsed = updateSessionNoteSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error);
    const input = parsed.data;

    const existing = await prisma.sessionNote.findUnique({
      where: { id },
      select: {
        id: true,
        counsellorId: true,
        severity: true,
        appointmentId: true,
        appointment: {
          select: { studentId: true, student: { select: { name: true } } },
        },
      },
    });
    if (!existing) return notFound("Session note not found");
    if (existing.counsellorId !== session.userId) return forbidden();

    const nextSeverity = input.severity ?? existing.severity;

    const note = await prisma.$transaction(async (tx) => {
      const updated = await tx.sessionNote.update({
        where: { id },
        data: {
          ...(input.notes !== undefined ? { content: input.notes } : {}),
          ...(input.severity !== undefined ? { severity: input.severity } : {}),
        },
      });

      // Only a transition into CRITICAL escalates — re-saving a note that was
      // already CRITICAL must not notify admins again.
      if (shouldEscalate(existing.severity, nextSeverity)) {
        await escalateCritical(tx, {
          noteId: updated.id,
          appointmentId: existing.appointmentId,
          counsellorId: session.userId,
          counsellorName: session.name,
          studentId: existing.appointment.studentId,
        });
      }
      return updated;
    });

    const escalated = shouldEscalate(existing.severity, nextSeverity);
    return ok(
      {
        note: {
          id: note.id,
          appointmentId: note.appointmentId,
          notes: note.content,
          severity: note.severity,
          updatedAt: note.updatedAt.toISOString(),
        },
      },
      {
        message: escalated
          ? "Note updated. Admins have been notified of the critical flag."
          : "Note updated.",
      },
    );
  } catch (error) {
    return apiError(error, "sessionNotes.update");
  }
}
