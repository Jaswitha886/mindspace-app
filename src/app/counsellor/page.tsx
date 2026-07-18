import Link from "next/link";
import { requirePageRole } from "@/lib/auth";
import { getCounsellorDashboardData } from "@/features/counsellor/dashboard-data";
import { SeverityTrendChart } from "@/features/counsellor/SeverityTrendChart";
import { RequestActions } from "@/features/counsellor/RequestActions";
import { Card } from "@/components/ui/card";
import { SEVERITY_META } from "@/features/notes/severity-meta";
import { EndSessionButton } from "@/features/checkin/ScanCheckIn";
import { isInSession } from "@/features/checkin/checkin";
import { ArrowRightIcon, CalendarIcon, UsersIcon } from "@/components/icons";
import { formatDateLong, formatTime, formatTimeRange } from "@/lib/format";

function longDate(): string {
  // Campus timezone is IST (UTC+5:30); render "today" from the counsellor's day.
  const ist = new Date(Date.now() + 5.5 * 3600 * 1000);
  return ist.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

export default async function CounsellorDashboard() {
  const session = await requirePageRole("COUNSELLOR");
  const {
    todaysSessions,
    pendingRequests,
    sessionsThisWeek,
    severityTrend,
    severityTotals,
  } = await getCounsellorDashboardData(session.userId);

  const firstName = session.name.split(" ").slice(0, 2).join(" ");
  const next = todaysSessions.find((s) => s.status === "APPROVED");

  // Derived, never stored: the counsellor is in session if one of today's is
  // checked in, unclosed, and still inside its window. A forgotten "End
  // session" therefore expires on its own instead of stranding them as busy.
  const now = new Date();
  const live = todaysSessions.find((s) => isInSession(s, now));

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="t-display">Welcome, {firstName}</h1>
        <p className="t-meta mt-1">{longDate()}</p>
      </header>

      {/* Your status — the one thing that changes when a student checks in, and
          the thing students see the other side of in "Counsellors Available
          Now". Teal block carries ink type, never white. */}
      <Card tone={live ? "teal" : "plum"}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[0.9375rem] font-semibold text-ink-secondary">
              Your status
            </p>
            <p className="t-figure mt-1 text-ink-strong">
              {live ? "In session" : "Available"}
            </p>
            <p className="t-meta mt-1">
              {live
                ? `With ${live.student.name} until ${formatTime(live.endTime)} — hidden from “Counsellors Available Now”.`
                : "Shown in “Counsellors Available Now”."}
            </p>
          </div>
          {/* Check-in itself lives on Schedule, next to the list of who's due.
              This card only reports the state and offers the way out of it. */}
          {live ? (
            <EndSessionButton appointmentId={live.id} />
          ) : (
            <Link
              href="/counsellor/schedule"
              className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-(--radius-btn) border border-brand/25 px-4 py-2 text-sm font-semibold text-brand-ink transition-colors hover:bg-brand/5"
            >
              Check a student in
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          )}
        </div>
      </Card>

      {/* Sessions this week + the mint schedule block. */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <Card tone="plum">
          <div className="flex items-center gap-2 text-brand-ink">
            <CalendarIcon className="h-[1.15rem] w-[1.15rem]" />
            <h2 className="text-[0.9375rem] font-semibold text-ink-secondary">
              Today&apos;s Schedule
            </h2>
          </div>
          <p className="t-figure mt-2 text-ink-strong">
            {todaysSessions.length} {todaysSessions.length === 1 ? "Session" : "Sessions"}
          </p>
          <p className="t-meta mt-2">
            {next
              ? `Next at ${formatTime(next.startTime)} with ${next.student.name}.`
              : "Nothing scheduled today."}
          </p>
        </Card>

        <Card>
          <h2 className="text-[0.9375rem] font-semibold text-ink-secondary">
            Sessions This Week
          </h2>
          <p className="t-figure mt-2 text-ink-strong">{sessionsThisWeek}</p>
          <p className="t-meta mt-2">confirmed or completed since Monday</p>
        </Card>

        <Card tone={pendingRequests.length > 0 ? "teal" : "sunken"}>
          <div className="flex items-center gap-2 text-ink-strong">
            <UsersIcon className="h-[1.15rem] w-[1.15rem]" />
            <h2 className="text-[0.9375rem] font-semibold">Pending Requests</h2>
          </div>
          <p className="t-figure mt-2 text-ink-strong">{pendingRequests.length}</p>
          <p className="mt-2 text-[0.8125rem] text-ink-strong/75">
            {pendingRequests.length > 0
              ? "Awaiting your confirmation."
              : "Nothing waiting on you."}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-start">
        {/* Requests → confirm/decline. */}
        <Card>
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="t-h2">Requests</h2>
            <span className="text-sm font-semibold text-ink-muted">
              {pendingRequests.length}
            </span>
          </div>
          {pendingRequests.length === 0 ? (
            <p className="t-body mt-2">
              No pending requests. New booking requests land here to confirm or
              decline.
            </p>
          ) : (
            <ul className="mt-3 flex flex-col">
              {pendingRequests.map((r) => (
                <li
                  key={r.id}
                  className="border-b border-line py-4 first:pt-0 last:border-0 last:pb-0"
                >
                  <p className="text-[0.9375rem] font-semibold text-ink">
                    {r.student.name}
                  </p>
                  <p className="t-meta mt-0.5">
                    {formatDateLong(r.appointmentDate)} ·{" "}
                    {formatTimeRange(r.startTime, r.endTime)}
                  </p>
                  {r.reason && (
                    <p className="mt-1.5 text-sm leading-relaxed text-ink-secondary">
                      “{r.reason}”
                    </p>
                  )}
                  <RequestActions appointmentId={r.id} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Confirmed → the schedule view. */}
        <Card>
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="t-h2">Today&apos;s Sessions</h2>
            <Link
              href="/counsellor/schedule"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-ink hover:underline"
            >
              View Full Schedule
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
          {todaysSessions.length === 0 ? (
            <p className="t-body mt-2">
              No sessions scheduled today. Confirmed appointments appear here on
              their day.
            </p>
          ) : (
            <ul className="mt-3 flex flex-col">
              {todaysSessions.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between gap-3 border-b border-line py-3 first:pt-0 last:border-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[0.9375rem] font-semibold text-ink">
                      {s.student.name}
                    </p>
                    <p className="t-meta">
                      {formatTimeRange(s.startTime, s.endTime)}
                      {/* Attendance in words, never colour alone. */}
                      {s.status === "COMPLETED"
                        ? " · Completed"
                        : isInSession(s, now)
                          ? " · In session"
                          : s.checkedInAt
                            ? " · Checked in, not closed"
                            : ""}
                    </p>
                  </div>
                  <Link
                    href={`/counsellor/notes/${s.id}`}
                    className="shrink-0 text-sm font-semibold text-brand-ink hover:underline"
                  >
                    {s.sessionNote ? "Edit note" : "Add note"}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Phase 3 widget: severity analysis of the counsellor's own sessions. */}
      <Card>
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <div>
            <h2 className="t-h2">Severity Analysis</h2>
            <p className="t-body mt-1">
              Your own session notes over the last 8 weeks.
            </p>
          </div>
          <dl className="flex flex-wrap gap-x-5 gap-y-1.5">
            {SEVERITY_META.map((s) => (
              <div key={s.key} className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: s.fill }}
                />
                <dt className="text-sm text-ink-secondary">{s.label}</dt>
                <dd className="text-sm font-semibold text-ink">{severityTotals[s.key]}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="mt-4">
          <SeverityTrendChart data={severityTrend} />
        </div>
      </Card>
    </div>
  );
}
