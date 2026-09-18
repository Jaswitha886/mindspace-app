import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getCounsellorDashboardData } from "@/features/counsellor/dashboard-data";
import { isInSession } from "@/features/checkin/checkin";
import { OnboardingSlides } from "@/features/student/OnboardingSlides";
import {
  CounsellorDashboardClient,
  type CounsellorDashboardClientProps,
} from "@/features/counsellor/CounsellorDashboardClient";
import { prisma } from "@/lib/prisma";

export default async function CounsellorDashboard() {
  const session = await getSession();
  if (!session) redirect("/login");
  const {
    todaysSessions,
    pendingRequests,
    sessionsThisWeek,
    severityTrend,
    severityTotals,
    activeSuspensions,
  } = await getCounsellorDashboardData(session.userId);

  // Notifications (suspension alerts)
  const suspensionNotifications = await prisma.notification.findMany({
    where: { recipientId: session.userId, type: "SUSPENSION_ALERT" },
    orderBy: [{ isRead: "asc" }, { createdAt: "desc" }],
    take: 20,
  });

  const unreadCount = suspensionNotifications.filter((n) => !n.isRead).length;

  const firstName = session.name.split(" ").slice(0, 2).join(" ");
  const next = todaysSessions.find((s) => s.status === "APPROVED");

  const now = new Date();
  const live = todaysSessions.find((s) => isInSession(s, now));

  // Additional stats
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const monthStart = new Date(today);
  monthStart.setUTCDate(1);

  const [totalStudentsThisMonth, completedToday, walkInsToday, recentAffirmations] =
    await Promise.all([
      prisma.appointment.findMany({
        where: {
          counsellorId: session.userId,
          appointmentDate: { gte: monthStart },
        },
        select: { studentId: true },
        distinct: ["studentId"],
      }).then((r) => r.length),
      prisma.appointment.count({
        where: {
          counsellorId: session.userId,
          status: "COMPLETED",
          appointmentDate: {
            gte: today,
            lt: new Date(today.getTime() + 86400000),
          },
        },
      }),
      prisma.appointment.findMany({
        where: {
          counsellorId: session.userId,
          reason: { contains: "Walk-in" },
          appointmentDate: { gte: today, lt: new Date(today.getTime() + 86400000) },
        },
        orderBy: { startTime: "desc" },
        select: {
          id: true,
          startTime: true,
          status: true,
          student: { select: { name: true } },
        },
      }),
      prisma.affirmation.findMany({
        where: { counsellorId: session.userId },
        orderBy: { createdAt: "desc" },
        take: 3,
        select: {
          id: true,
          message: true,
          createdAt: true,
        },
      }),
    ]);

  const walkInsCount = walkInsToday.length;
  const upcomingCount = todaysSessions.filter(
    (s) => s.status === "APPROVED" && !isInSession(s, now),
  ).length;

  // Compute next session minutes remaining
  let nextSessionMinutes: number | null = null;
  if (next) {
    const [nh, nm] = next.startTime.split(":").map(Number);
    const nextDate = new Date(next.appointmentDate);
    nextDate.setUTCHours(nh, nm, 0, 0);
    nextSessionMinutes = Math.max(
      0,
      Math.round((nextDate.getTime() - now.getTime()) / 60000),
    );
  }

  // Build notification items for the client
  const notificationItems = suspensionNotifications.map((notification) => {
    const payload = notification.payload;
    if (!payload || typeof payload !== "object") return null;
    const p = payload as Record<string, unknown>;
    if (
      typeof p.studentName !== "string" ||
      typeof p.studentEmail !== "string" ||
      typeof p.reason !== "string" ||
      typeof p.startDate !== "string" ||
      typeof p.endDate !== "string"
    )
      return null;
    return {
      id: notification.id,
      isRead: notification.isRead,
      createdAt: notification.createdAt.toISOString(),
      studentName: p.studentName,
      studentEmail: p.studentEmail,
      registerNumber:
        typeof p.registerNumber === "string" ? p.registerNumber : null,
      reason: p.reason,
      startDate: p.startDate,
      endDate: p.endDate,
      notes: typeof p.notes === "string" ? p.notes : null,
    };
  }).filter(Boolean) as Array<{
    id: string;
    isRead: boolean;
    createdAt: string;
    studentName: string;
    studentEmail: string;
    registerNumber: string | null;
    reason: string;
    startDate: string;
    endDate: string;
    notes: string | null;
  }>;

  const props: CounsellorDashboardClientProps = {
    todaysSessions: todaysSessions.map((s) => ({
      id: s.id,
      startTime: s.startTime,
      endTime: s.endTime,
      status: s.status,
      checkedInAt: s.checkedInAt,
      appointmentDate: s.appointmentDate,
      student: { name: s.student.name },
      sessionNote: s.sessionNote
        ? { id: s.sessionNote.id, severity: s.sessionNote.severity }
        : null,
    })),
    pendingRequests: pendingRequests.map((r) => ({
      id: r.id,
      appointmentDate: r.appointmentDate,
      startTime: r.startTime,
      endTime: r.endTime,
      reason: r.reason,
      student: { name: r.student.name },
    })),
    sessionsThisWeek,
    severityTrend,
    severityTotals,
    activeSuspensions,
    firstName,
    live: live
      ? {
          id: live.id,
          student: { name: live.student.name },
          endTime: live.endTime,
        }
      : null,
    next: next
      ? {
          student: { name: next.student.name },
          startTime: next.startTime,
          appointmentDate: next.appointmentDate,
        }
      : undefined,
    now: now.toISOString(),
    totalStudentsThisMonth,
    walkInsCount,
    completedToday,
    upcomingToday: upcomingCount,
    nextSessionMinutes,
    notifications: notificationItems,
    unreadNotificationCount: unreadCount,
    recentAffirmations: recentAffirmations.map((a) => ({
      id: a.id,
      message: a.message,
      createdAt: a.createdAt.toISOString(),
    })),
    walkInsToday: walkInsToday.map((w) => ({
      id: w.id,
      startTime: w.startTime,
      status: w.status,
      student: { name: w.student.name },
    })),
  };

  return (
    <>
      <OnboardingSlides role="counsellor" />
      <CounsellorDashboardClient {...props} />
    </>
  );
}
