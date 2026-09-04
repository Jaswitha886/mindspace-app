import { requirePageRole } from "@/lib/auth";
import { getCounsellorDashboardData } from "@/features/counsellor/dashboard-data";
import { isInSession } from "@/features/checkin/checkin";
import { OnboardingSlides } from "@/features/student/OnboardingSlides";
import {
  CounsellorDashboardClient,
  type CounsellorDashboardClientProps,
} from "@/features/counsellor/CounsellorDashboardClient";

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

  return (
    <>
      <OnboardingSlides role="counsellor" />
      <CounsellorDashboardClient {...props} />
    </>
  );
}
