import { prisma } from "@/lib/prisma";
import type { InboxItem } from "@/features/admin/EscalationInbox";

// How a stored escalation becomes something an admin reads. Both the dashboard
// preview and the full inbox go through here — narrowing the payload in each
// view separately is how the two drift apart.
//
// **Admins do not see which student was flagged.** They see the counsellor, the
// time, and the student's department — enough to act on a pattern, not enough
// to identify the person. The name stays between the student and their
// counsellor; the AuditLog (not this) is the record that names them.

type EscalationRow = {
  id: string;
  isRead: boolean;
  createdAt: Date;
  payload: unknown;
};

const UNKNOWN_DEPARTMENT = "an unrecorded department";

/** Notification.payload is Json; narrow it before trusting it. */
function narrow(payload: unknown) {
  const p = (payload ?? {}) as Record<string, unknown>;
  return {
    counsellorName:
      typeof p.counsellorName === "string" ? p.counsellorName : "A counsellor",
    // Resolved to a department below, never rendered. Payloads written before
    // this change also carry `studentName` — deliberately not read.
    studentId: typeof p.studentId === "string" ? p.studentId : null,
  };
}

/**
 * Rows → what the inbox renders, resolving each student's department in one
 * batched lookup.
 *
 * Department is read live rather than stored in the payload so that older
 * escalations (written before departments were shown) still resolve, and so a
 * student who transfers doesn't leave stale rows behind.
 */
export async function toInboxItems(rows: EscalationRow[]): Promise<InboxItem[]> {
  const narrowed = rows.map((r) => ({ row: r, ...narrow(r.payload) }));

  const studentIds = [...new Set(narrowed.map((n) => n.studentId).filter((id) => id !== null))];

  const students = studentIds.length
    ? await prisma.user.findMany({
        where: { id: { in: studentIds } },
        select: { id: true, department: { select: { name: true } } },
      })
    : [];

  const departmentById = new Map(
    students.map((s) => [s.id, s.department?.name ?? UNKNOWN_DEPARTMENT]),
  );

  return narrowed.map(({ row, counsellorName, studentId }) => ({
    id: row.id,
    isRead: row.isRead,
    createdAt: row.createdAt.toISOString(),
    counsellorName,
    studentDepartment:
      (studentId && departmentById.get(studentId)) || UNKNOWN_DEPARTMENT,
  }));
}
