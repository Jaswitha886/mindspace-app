import { requirePageRole } from "@/lib/auth";
import { getCounsellorDashboardData } from "@/features/counsellor/dashboard-data";
import { isInSession } from "@/features/checkin/checkin";
import { OnboardingSlides } from "@/features/student/OnboardingSlides";
import {
  CounsellorDashboardClient,
  type CounsellorDashboardClientProps,
} from "@/features/counsellor/CounsellorDashboardClient";
import { SuspensionAlerts, type SuspensionAlertItem } from "@/features/counsellor/SuspensionAlerts";
import { prisma } from "@/lib/prisma";

export default async function CounsellorDashboard() {
  const session = await requirePageRole("COUNSELLOR");
  const {
    todaysSessions,
    pendingRequests,
    sessionsThisWeek,
    severityTrend,
    severityTotals,
    activeSuspensions,
  } = await getCounsellorDashboardData(session.userId);
  const suspensionNotifications = await prisma.notification.findMany({
    where: { recipientId: session.userId, type: "SUSPENSION_ALERT" },
    orderBy: [{ isRead: "asc" }, { createdAt: "desc" }],
    take: 20,
  });

  const firstName = session.name.split(" ").slice(0, 2).join(" ");
  const next = todaysSessions.find((s) => s.status === "APPROVED");

  const now = new Date();
  const live = todaysSessions.find((s) => isInSession(s, now));

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
      ? { student: { name: next.student.name }, startTime: next.startTime }
      : undefined,
    now: now.toISOString(),
  };

  const suspensionAlerts: SuspensionAlertItem[] = suspensionNotifications.flatMap((notification) => {
    const payload = notification.payload;
    if (!payload || typeof payload !== "object") return [];
    const p = payload as Record<string, unknown>;
    if (
      typeof p.studentName !== "string" ||
      typeof p.studentEmail !== "string" ||
      typeof p.reason !== "string" ||
      typeof p.startDate !== "string" ||
      typeof p.endDate !== "string"
    ) return [];
    return [{
      id: notification.id,
      isRead: notification.isRead,
      createdAt: notification.createdAt.toISOString(),
      studentName: p.studentName,
      studentEmail: p.studentEmail,
      registerNumber: typeof p.registerNumber === "string" ? p.registerNumber : null,
      reason: p.reason,
      startDate: p.startDate,
      endDate: p.endDate,
      notes: typeof p.notes === "string" ? p.notes : null,
    }];
  });

  return (
    <>
      <OnboardingSlides role="counsellor" />
      <div className="flex flex-col gap-5">
        <SuspensionAlerts items={suspensionAlerts} />
        <CounsellorDashboardClient {...props} />
      </div>
    </>
  );
}
