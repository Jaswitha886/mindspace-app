import { prisma } from "@/lib/prisma";

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

  // "Counsellors Available Now" on the reference dashboard: counsellors with
  // at least one active availability window.
  const counsellors = await prisma.user.findMany({
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
    take: 3,
  });

  return { upcoming, recentMoods, recentJournal, affirmations, counsellors };
}
