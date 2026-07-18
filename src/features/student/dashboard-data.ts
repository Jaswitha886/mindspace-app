import { prisma } from "@/lib/prisma";
import { isInSession } from "@/features/checkin/checkin";

// Dashboard-home queries (server components only). Everything is scoped to
// the student's own userId — journal and moods are structurally private.
export async function getStudentDashboardData(studentId: string) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const [upcoming, recentMoods, recentJournal, counsellorIds] = await Promise.all([
    prisma.appointment.findFirst({
      where: {
        studentId,
        status: { in: ["APPROVED", "PENDING"] },
        appointmentDate: { gte: today },
      },
      orderBy: [{ appointmentDate: "asc" }, { startTime: "asc" }],
      include: {
        counsellor: {
          select: {
            name: true,
            counsellorProfile: { select: { specialization: true } },
          },
        },
      },
    }),
    prisma.moodLog.findMany({
      where: { studentId },
      orderBy: { logDate: "desc" },
      take: 5,
    }),
    prisma.journalEntry.findMany({
      where: { studentId },
      orderBy: { createdAt: "desc" },
      take: 2,
      select: { id: true, title: true, content: true, createdAt: true },
    }),
    prisma.appointment.findMany({
      where: { studentId, status: { in: ["APPROVED", "COMPLETED"] } },
      select: { counsellorId: true },
      distinct: ["counsellorId"],
    }),
  ]);

  const affirmations = await prisma.affirmation.findMany({
    where: {
      isActive: true,
      OR: [
        { targetStudentId: studentId },
        {
          targetStudentId: null,
          counsellorId: { in: counsellorIds.map((c) => c.counsellorId) },
        },
      ],
    },
    select: {
      id: true,
      message: true,
      createdAt: true,
      counsellor: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  // "Counsellors Available Now": counsellors with at least one active
  // availability window, minus anyone currently in a session.
  //
  // "In session" depends on the slot's end time, which is an "HH:mm" string —
  // not something Prisma can compare against now(). So the busy set is computed
  // in app code, and the list is over-fetched and sliced *after* filtering:
  // taking 3 first would silently show fewer than 3 whenever someone is busy.
  const candidates = await prisma.user.findMany({
    where: {
      role: "COUNSELLOR",
      isActive: true,
      availabilities: { some: { isActive: true } },
    },
    select: {
      id: true,
      name: true,
      counsellorProfile: { select: { specialization: true } },
    },
    orderBy: { name: "asc" },
    take: 12,
  });

  const busy = await inSessionCounsellorIds(candidates.map((c) => c.id));
  const counsellors = candidates.filter((c) => !busy.has(c.id)).slice(0, 3);

  return { upcoming, recentMoods, recentJournal, affirmations, counsellors };
}

/**
 * Which of these counsellors are mid-session right now.
 *
 * Derived, never stored — see features/checkin/checkin.ts. The date filter is
 * only a cheap prefilter to keep the scan small; `isInSession` is what actually
 * decides, including the window that makes a forgotten "End session" expire on
 * its own. Yesterday is included because a slot can straddle midnight UTC.
 */
async function inSessionCounsellorIds(ids: string[]): Promise<Set<string>> {
  if (ids.length === 0) return new Set();

  const now = new Date();
  const since = new Date(now);
  since.setUTCHours(0, 0, 0, 0);
  since.setUTCDate(since.getUTCDate() - 1);

  const live = await prisma.appointment.findMany({
    where: {
      counsellorId: { in: ids },
      status: "APPROVED",
      checkedInAt: { not: null },
      appointmentDate: { gte: since },
    },
    select: {
      counsellorId: true,
      status: true,
      checkedInAt: true,
      appointmentDate: true,
      startTime: true,
      endTime: true,
    },
  });

  return new Set(
    live.filter((a) => isInSession(a, now)).map((a) => a.counsellorId),
  );
}
