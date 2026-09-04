import { prisma } from "@/lib/prisma";
import type { SeverityLevel } from "@prisma/client";

// Counsellor home queries (server components only). Everything is scoped to
// the counsellor's own userId — one counsellor never sees another's caseload.

/** Monday 00:00 UTC of the week containing `now`. */
export function startOfWeek(now = new Date()): Date {
  const d = new Date(now);
  d.setUTCHours(0, 0, 0, 0);
  const dow = d.getUTCDay(); // 0 = Sunday
  d.setUTCDate(d.getUTCDate() - (dow === 0 ? 6 : dow - 1));
  return d;
}

export type SeverityWeek = {
  label: string;
  MILD: number;
  MODERATE: number;
  CRITICAL: number;
};

/** The counsellor's own notes bucketed by ISO week, oldest → newest. */
function bucketBySeverityWeek(
  notes: Array<{ createdAt: Date; severity: SeverityLevel }>,
  weeks: number,
): SeverityWeek[] {
  const thisWeek = startOfWeek();
  const buckets: SeverityWeek[] = [];
  const index = new Map<number, SeverityWeek>();

  for (let i = weeks - 1; i >= 0; i--) {
    const start = new Date(thisWeek);
    start.setUTCDate(start.getUTCDate() - i * 7);
    const bucket: SeverityWeek = {
      label: start.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        timeZone: "UTC",
      }),
      MILD: 0,
      MODERATE: 0,
      CRITICAL: 0,
    };
    buckets.push(bucket);
    index.set(start.getTime(), bucket);
  }

  for (const note of notes) {
    const bucket = index.get(startOfWeek(note.createdAt).getTime());
    if (bucket) bucket[note.severity] += 1;
  }
  return buckets;
}

export async function getCounsellorDashboardData(counsellorId: string) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

  const weekStart = startOfWeek();
  const TREND_WEEKS = 8;
  const trendSince = new Date(weekStart);
  trendSince.setUTCDate(trendSince.getUTCDate() - (TREND_WEEKS - 1) * 7);

  const [todaysSessions, pendingRequests, sessionsThisWeek, trendNotes, activeSuspensions] =
    await Promise.all([
      prisma.appointment.findMany({
        where: {
          counsellorId,
          // COMPLETED belongs here: ending a session must not erase it from the
          // day, or the counsellor loses the row — and its "Add note" link —
          // the moment they close it.
          status: { in: ["APPROVED", "COMPLETED"] },
          appointmentDate: { gte: today, lt: tomorrow },
        },
        orderBy: { startTime: "asc" },
        select: {
          id: true,
          startTime: true,
          endTime: true,
          // Needed by isInSession() — it derives "in session" from the status,
          // the check-in stamp, and the slot window together.
          status: true,
          checkedInAt: true,
          appointmentDate: true,
          student: { select: { name: true } },
          sessionNote: { select: { id: true, severity: true } },
        },
      }),
      prisma.appointment.findMany({
        where: { counsellorId, status: "PENDING" },
        orderBy: [{ appointmentDate: "asc" }, { startTime: "asc" }],
        select: {
          id: true,
          appointmentDate: true,
          startTime: true,
          endTime: true,
          reason: true,
          student: { select: { name: true } },
        },
      }),
      prisma.appointment.count({
        where: {
          counsellorId,
          status: { in: ["APPROVED", "COMPLETED"] },
          appointmentDate: { gte: weekStart },
        },
      }),
      prisma.sessionNote.findMany({
        where: { counsellorId, createdAt: { gte: trendSince } },
        select: { createdAt: true, severity: true },
      }),
      prisma.suspension.findMany({
        where: { status: "ACTIVE" },
        orderBy: [{ endDate: "asc" }, { createdAt: "desc" }],
        select: {
          id: true,
          reason: true,
          startDate: true,
          endDate: true,
          notes: true,
          student: {
            select: {
              name: true,
              email: true,
              studentProfile: { select: { registerNumber: true } },
            },
          },
        },
      }),
    ]);

  return {
    todaysSessions,
    pendingRequests,
    sessionsThisWeek,
    severityTrend: bucketBySeverityWeek(trendNotes, TREND_WEEKS),
    severityTotals: {
      MILD: trendNotes.filter((n) => n.severity === "MILD").length,
      MODERATE: trendNotes.filter((n) => n.severity === "MODERATE").length,
      CRITICAL: trendNotes.filter((n) => n.severity === "CRITICAL").length,
    },
    activeSuspensions,
  };
}
