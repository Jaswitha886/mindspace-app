import { requirePageRole } from "@/lib/auth";
import { getStudentDashboardData } from "@/features/student/dashboard-data";
import {
  isWithinCheckInWindow,
  checkInWindow,
  signCheckInToken,
  sessionCode,
  formatSessionCode,
} from "@/features/checkin/checkin";
import { formatDate, formatDateLong, formatTimeRange } from "@/lib/format";
import QRCode from "qrcode";
import {
  StudentDashboardClient,
  type CheckInState,
} from "@/features/student/StudentDashboardClient";

async function qrSvg(payload: string): Promise<string> {
  return QRCode.toString(payload, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 3,
    width: 132,
    color: { dark: "#241826", light: "#ffffff" },
  });
}

export default async function StudentDashboard() {
  const session = await requirePageRole("STUDENT");
  const { upcoming, recentMoods, affirmations, counsellors, isNewUser } =
    await getStudentDashboardData(session.userId);

  const firstName = session.name.split(" ")[0];
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const todaysMood =
    recentMoods[0]?.logDate.getTime() === today.getTime()
      ? recentMoods[0].mood
      : null;

  /* ---------- Check-in pre-computation (server-only: node:crypto + qrcode) ---- */

  let checkInState: CheckInState = null;

  if (upcoming?.status === "APPROVED") {
    if (upcoming.checkedInAt) {
      checkInState = {
        kind: "checkedIn",
        checkedInAt: upcoming.checkedInAt.toISOString(),
      };
    } else if (isWithinCheckInWindow(upcoming)) {
      const { closes } = checkInWindow(upcoming);
      const token = await signCheckInToken(
        { appointmentId: upcoming.id, studentId: session.userId },
        closes,
      );
      const svg = await qrSvg(token);
      const code = formatSessionCode(sessionCode(upcoming.id));
      checkInState = {
        kind: "ready",
        svg,
        code,
        appointmentId: upcoming.id,
        studentId: session.userId,
        appointmentDate: upcoming.appointmentDate.toISOString(),
        startTime: upcoming.startTime,
        endTime: upcoming.endTime,
      };
    } else {
      checkInState = { kind: "waiting" };
    }
  }

  /* ---------- Serialise props for the client component ---- */

  const upcomingData = upcoming
    ? {
        id: upcoming.id,
        counsellorName: upcoming.counsellor.name,
        dateLabel: formatDateLong(upcoming.appointmentDate),
        timeLabel: formatTimeRange(upcoming.startTime, upcoming.endTime),
        status: upcoming.status,
        checkedInAt: upcoming.checkedInAt?.toISOString() ?? null,
      }
    : null;

  return (
    <StudentDashboardClient
      firstName={firstName}
      todayLabel={formatDateLong(today)}
      isNewUser={isNewUser}
      todaysMood={todaysMood}
      upcoming={upcomingData}
      checkInState={checkInState}
      affirmations={affirmations.map((a) => ({
        id: a.id,
        message: a.message,
        counsellorName: a.counsellor.name,
        dateLabel: formatDate(a.createdAt),
      }))}
      counsellors={counsellors.map((c) => ({
        id: c.id,
        name: c.name,
        specialization: c.counsellorProfile?.specialization ?? null,
      }))}
    />
  );
}
