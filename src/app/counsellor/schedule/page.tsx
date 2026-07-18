import { prisma } from "@/lib/prisma";
import { requirePageRole } from "@/lib/auth";
import { PageTitle } from "@/components/ui/page-title";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { StatusChip } from "@/components/ui/status-chip";
import { CalendarIcon } from "@/components/icons";
import { ScanCheckIn, EndSessionButton } from "@/features/checkin/ScanCheckIn";
import { WalkInSearch } from "@/features/checkin/WalkInSearch";
import { isInSession } from "@/features/checkin/checkin";
import { formatDateLong, formatTimeRange } from "@/lib/format";

// Confirmed appointments, upcoming first — where a request lands once approved,
// and where check-in happens: this is the screen that already lists who is due,
// so it's the one you have open when a student walks in.
export default async function CounsellorSchedulePage() {
  const session = await requirePageRole("COUNSELLOR");

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  // Upcoming only. Completed and past sessions live on History now, so ending a
  // session moves it off this page rather than leaving it here as clutter.
  const appointments = await prisma.appointment.findMany({
    where: {
      counsellorId: session.userId,
      status: "APPROVED",
      appointmentDate: { gte: today },
    },
    orderBy: [{ appointmentDate: "asc" }, { startTime: "asc" }],
    select: {
      id: true,
      appointmentDate: true,
      startTime: true,
      endTime: true,
      status: true,
      reason: true,
      checkedInAt: true,
      student: { select: { name: true } },
      sessionNote: { select: { id: true, severity: true } },
    },
  });

  const now = new Date();
  const live = appointments.find((a) => isInSession(a, now));

  // Group by day so the list reads as a schedule, not a flat feed.
  const byDay = new Map<string, typeof appointments>();
  for (const a of appointments) {
    const key = a.appointmentDate.toISOString().slice(0, 10);
    byDay.set(key, [...(byDay.get(key) ?? []), a]);
  }

  return (
    <div className="flex flex-col gap-5">
      <PageTitle sub="Your confirmed sessions, soonest first.">Schedule</PageTitle>

      {/* Check-in sits above the list: the student is in front of you, and this
          is the screen showing who's due. In session, it swaps for the way out
          of the session rather than offering to start another. */}
      <Card tone={live ? "teal" : "plum"}>
        {live ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="t-h3">In session with {live.student.name}</p>
              <p className="t-meta mt-1">
                Checked in · until {formatTimeRange(live.startTime, live.endTime)}.
                You&apos;re hidden from “Counsellors Available Now”.
              </p>
            </div>
            <EndSessionButton appointmentId={live.id} />
          </div>
        ) : (
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="flex-1">
              <p className="t-h3">Check a student in</p>
              <p className="t-meta mb-3 mt-1">
                For a booked session — scan the code on their dashboard, or type
                it. Works from 15 minutes before until 30 after.
              </p>
              <ScanCheckIn />
            </div>

            <div
              className="hidden w-px self-stretch bg-border sm:block"
              aria-hidden
            />

            <div className="flex-1">
              <p className="t-h3">Walk-in</p>
              <p className="t-meta mb-3 mt-1">
                No appointment? Find the student and start a session now.
              </p>
              <WalkInSearch />
            </div>
          </div>
        )}
      </Card>

      {appointments.length === 0 ? (
        <EmptyState
          icon={<CalendarIcon className="h-12 w-12" />}
          title="Nothing confirmed yet"
          body="Requests you confirm will appear here on their day."
        />
      ) : (
        [...byDay.entries()].map(([day, rows]) => (
          <section key={day}>
            <h2 className="t-h3 mb-2 px-1">{formatDateLong(rows[0].appointmentDate)}</h2>
            <Card>
              <ul className="flex flex-col">
                {rows.map((a) => (
                  <li
                    key={a.id}
                    className="flex flex-wrap items-center justify-between gap-3 border-b border-line py-3.5 first:pt-0 last:border-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[0.9375rem] font-semibold text-ink">
                        {a.student.name}
                      </p>
                      <p className="t-meta">
                        {formatTimeRange(a.startTime, a.endTime)}
                        {/* Attendance in words — never colour alone. */}
                        {isInSession(a, now)
                          ? " · In session"
                          : a.checkedInAt && a.status === "APPROVED"
                            ? " · Checked in, not closed"
                            : ""}
                      </p>
                      {a.reason && (
                        <p className="mt-1 max-w-prose text-sm text-ink-secondary">
                          “{a.reason}”
                        </p>
                      )}
                    </div>
                    {/* No note link here — notes are written on History, once
                        the session is done. Schedule is for what's ahead. */}
                    <StatusChip status={a.status} />
                  </li>
                ))}
              </ul>
            </Card>
          </section>
        ))
      )}
    </div>
  );
}
