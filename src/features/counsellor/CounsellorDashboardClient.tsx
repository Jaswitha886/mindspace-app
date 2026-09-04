"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { EndSessionButton } from "@/features/checkin/ScanCheckIn";
import { RequestActions } from "@/features/counsellor/RequestActions";
import { SeverityTrendChart } from "@/features/counsellor/SeverityTrendChart";
import { QuoteOfDayForm } from "@/features/counsellor/QuoteOfDayForm";
import { SEVERITY_META } from "@/features/notes/severity-meta";
import { ArrowRightIcon, CalendarIcon, UsersIcon } from "@/components/icons";
import { formatTime, formatTimeRange, formatDateLong } from "@/lib/format";
import type { SeverityWeek } from "@/features/counsellor/dashboard-data";

// ── Types ───────────────────────────────────────────────────────────────────

type Session = {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  checkedInAt: Date | null;
  appointmentDate: Date;
  student: { name: string };
  sessionNote: { id: string; severity: string } | null;
};

type Request = {
  id: string;
  appointmentDate: Date;
  startTime: string;
  endTime: string;
  reason: string | null;
  student: { name: string };
};

type LiveSession = {
  id: string;
  student: { name: string };
  endTime: string;
};

type ActiveSuspension = {
  id: string;
  reason: string;
  startDate: Date;
  endDate: Date;
  notes: string | null;
  student: {
    name: string;
    email: string;
    studentProfile: { registerNumber: string } | null;
  };
};

export type CounsellorDashboardClientProps = {
  todaysSessions: Session[];
  pendingRequests: Request[];
  sessionsThisWeek: number;
  severityTrend: SeverityWeek[];
  severityTotals: { MILD: number; MODERATE: number; CRITICAL: number };
  activeSuspensions: ActiveSuspension[];
  firstName: string;
  live: LiveSession | null;
  next: { student: { name: string }; startTime: string } | undefined;
  now: string; // ISO string — serialisable
};

// ── Animation variants ──────────────────────────────────────────────────────

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

const slideLeft = {
  hidden: { opacity: 0, x: -24 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

const slideRight = {
  hidden: { opacity: 0, x: 24 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

// ── Component ───────────────────────────────────────────────────────────────

export function CounsellorDashboardClient({
  todaysSessions,
  pendingRequests,
  sessionsThisWeek,
  severityTrend,
  severityTotals,
  activeSuspensions,
  firstName,
  live,
  next,
  now,
}: CounsellorDashboardClientProps) {
  const nowDate = new Date(now);

  return (
    <motion.div
      className="flex flex-col gap-5"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* ── Header ─────────────────────────────────────────────────── */}
      <motion.header variants={fadeUp}>
        <h1 className="t-display">Welcome, {firstName}</h1>
        <p className="t-meta mt-1">
          {nowDate.toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
            timeZone: "UTC",
          })}
        </p>
      </motion.header>

      {/* ── Status card ────────────────────────────────────────────── */}
      <motion.div variants={fadeUp}>
        <Card
          tone={live ? "teal" : "plum"}
          className={!live ? "breathe-teal" : undefined}
        >
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
                  ? `With ${live.student.name} until ${formatTime(live.endTime)} \u2014 hidden from \u201cCounsellors Available Now\u201d.`
                  : "Shown in \u201cCounsellors Available Now\u201d."}
              </p>
            </div>
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
      </motion.div>

      <motion.div variants={fadeUp}>
        <Card tone="plum">
          <h2 className="t-h2">Quote of the day</h2>
          <p className="t-body mt-1">
            Share a supportive message with students you have counselled.
          </p>
          <QuoteOfDayForm />
        </Card>
      </motion.div>

      {/* ── Stat cards (stagger) ───────────────────────────────────── */}
      <motion.div
        className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
        variants={container}
      >
        <motion.div variants={fadeUp}>
          <Card tone="plum">
            <div className="flex items-center gap-2 text-brand-ink">
              <CalendarIcon className="h-[1.15rem] w-[1.15rem]" />
              <h2 className="text-[0.9375rem] font-semibold text-ink-secondary">
                Today&apos;s Schedule
              </h2>
            </div>
            <p className="t-figure mt-2 text-ink-strong">
              {todaysSessions.length}{" "}
              {todaysSessions.length === 1 ? "Session" : "Sessions"}
            </p>
            <p className="t-meta mt-2">
              {next
                ? `Next at ${formatTime(next.startTime)} with ${next.student.name}.`
                : "Nothing scheduled today."}
            </p>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp}>
          <Card>
            <h2 className="text-[0.9375rem] font-semibold text-ink-secondary">
              Sessions This Week
            </h2>
            <p className="t-figure mt-2 text-ink-strong">{sessionsThisWeek}</p>
            <p className="t-meta mt-2">
              confirmed or completed since Monday
            </p>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp}>
          <Card tone={pendingRequests.length > 0 ? "teal" : "sunken"}>
            <div className="flex items-center gap-2 text-ink-strong">
              <UsersIcon className="h-[1.15rem] w-[1.15rem]" />
              <h2 className="text-[0.9375rem] font-semibold">
                Pending Requests
              </h2>
            </div>
            <p className="t-figure mt-2 text-ink-strong">
              {pendingRequests.length}
            </p>
            <p className="mt-2 text-[0.8125rem] text-ink-strong/75">
              {pendingRequests.length > 0
                ? "Awaiting your confirmation."
                : "Nothing waiting on you."}
            </p>
          </Card>
        </motion.div>
      </motion.div>

      {/* ── Requests + Today's Sessions ────────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-start">
        {/* Requests — slide in from left */}
        <motion.div variants={slideLeft}>
          <Card>
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="t-h2">Requests</h2>
              <span className="text-sm font-semibold text-ink-muted">
                {pendingRequests.length}
              </span>
            </div>
            {pendingRequests.length === 0 ? (
              <p className="t-body mt-2">
                No pending requests. New booking requests land here to confirm
                or decline.
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
                        &ldquo;{r.reason}&rdquo;
                      </p>
                    )}
                    <RequestActions appointmentId={r.id} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </motion.div>

        {/* Sessions — slide in from right */}
        <motion.div variants={slideRight}>
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
                No sessions scheduled today. Confirmed appointments appear here
                on their day.
              </p>
            ) : (
              <ul className="mt-3 flex flex-col">
                {todaysSessions.map((s) => {
                  const isIn = (() => {
                    if (s.status !== "APPROVED" || !s.checkedInAt) return false;
                    const end = new Date(s.appointmentDate);
                    const [eh, em] = s.endTime.split(":").map(Number);
                    end.setUTCHours(eh, em, 0, 0);
                    end.setUTCMinutes(end.getUTCMinutes() + 30);
                    return nowDate <= end;
                  })();

                  return (
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
                          {s.status === "COMPLETED"
                            ? " \u00b7 Completed"
                            : isIn
                              ? " \u00b7 In session"
                              : s.checkedInAt
                                ? " \u00b7 Checked in, not closed"
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
                  );
                })}
              </ul>
            )}
          </Card>
        </motion.div>
      </div>

      <motion.div variants={fadeUp}>
        <Card tone="sunken">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <h2 className="t-h2">Suspended students</h2>
              <p className="t-body mt-1">
                Active suspension information shared by the wellness centre.
              </p>
            </div>
            <span className="t-meta">{activeSuspensions.length} active</span>
          </div>
          {activeSuspensions.length === 0 ? (
            <p className="t-body mt-3">No active student suspensions.</p>
          ) : (
            <ul className="mt-3 flex flex-col">
              {activeSuspensions.map((suspension) => (
                <li
                  key={suspension.id}
                  className="border-b border-line py-4 first:pt-0 last:border-0 last:pb-0"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[0.9375rem] font-semibold text-ink">
                        {suspension.student.name}
                      </p>
                      <p className="t-meta mt-0.5">
                        {suspension.student.studentProfile?.registerNumber ??
                          suspension.student.email}
                      </p>
                      {suspension.student.studentProfile?.registerNumber && (
                        <p className="t-meta mt-0.5">
                          {suspension.student.email}
                        </p>
                      )}
                    </div>
                    <p className="t-meta">
                      {formatDateLong(suspension.startDate)} to {formatDateLong(suspension.endDate)}
                    </p>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
                    {suspension.reason}
                  </p>
                  {suspension.notes && (
                    <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                      {suspension.notes}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </motion.div>

      {/* ── Severity Analysis ──────────────────────────────────────── */}
      <motion.div variants={fadeUp}>
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
                  <dd className="text-sm font-semibold text-ink">
                    {severityTotals[s.key]}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="mt-4">
            <SeverityTrendChart data={severityTrend} />
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
