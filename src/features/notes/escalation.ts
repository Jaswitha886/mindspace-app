import type { Prisma } from "@prisma/client";

// CRITICAL severity is an action trigger, not a label (docs/MASTER_PROMPT.md).
// Flagging a note CRITICAL must, in the same transaction as the note write:
//   1. notify every Admin in-app, and
//   2. write an AuditLog row naming the counsellor, the student, and the note.
// Both live here so no caller can do half of it — never inline this logic.
//
// The split matters: the **AuditLog** names the student (that is the record of
// who was flagged, and it must). The **Notification** does not — admins act on
// the escalation knowing only the counsellor and the student's department. So
// the student's name is not part of this context at all.

export type EscalationContext = {
  noteId: string;
  appointmentId: string;
  counsellorId: string;
  counsellorName: string;
  studentId: string;
};

/**
 * Fire the escalation. MUST be called inside the same `prisma.$transaction` as
 * the note create/update, so a note can never be CRITICAL in the database
 * without its notification and audit trail.
 *
 * Callers decide *whether* to escalate via `shouldEscalate` — this only fires
 * on a transition into CRITICAL, so re-saving an already-critical note doesn't
 * spam admins with duplicates.
 */
export async function escalateCritical(
  tx: Prisma.TransactionClient,
  ctx: EscalationContext,
): Promise<void> {
  const admins = await tx.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true },
  });

  // An escalation nobody can receive is a silent one. Fail loudly instead:
  // the note write rolls back rather than committing an un-escalated CRITICAL.
  if (admins.length === 0) {
    throw new Error(
      "Cannot escalate CRITICAL severity: no ADMIN users exist to notify.",
    );
  }

  await tx.notification.createMany({
    data: admins.map((admin) => ({
      recipientId: admin.id,
      type: "CRITICAL_SEVERITY" as const,
      payload: {
        noteId: ctx.noteId,
        appointmentId: ctx.appointmentId,
        counsellorId: ctx.counsellorId,
        counsellorName: ctx.counsellorName,
        // studentId is stored to resolve the department at read time — it is
        // never rendered. No studentName: an admin sees that *a* student in a
        // department was flagged, not who. Nothing from `content` belongs here
        // either; the note body is never in this payload.
        studentId: ctx.studentId,
      },
    })),
  });

  await tx.auditLog.create({
    data: {
      actorId: ctx.counsellorId,
      action: "CRITICAL_SEVERITY_FLAG",
      targetId: ctx.studentId,
      metadata: {
        noteId: ctx.noteId,
        appointmentId: ctx.appointmentId,
      },
    },
  });
}

/** Escalate only on a transition *into* CRITICAL — not on every re-save. */
export function shouldEscalate(
  previous: "MILD" | "MODERATE" | "CRITICAL" | null,
  next: "MILD" | "MODERATE" | "CRITICAL",
): boolean {
  return next === "CRITICAL" && previous !== "CRITICAL";
}
