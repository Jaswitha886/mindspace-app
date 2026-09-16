"use client";

import Link from "next/link";
import { useState, useCallback } from "react";
import { motion, type Variants } from "framer-motion";
import { Card } from "@/components/ui/card";
import { QuoteOfDayForm } from "@/features/counsellor/QuoteOfDayForm";
import {
  CalendarIcon,
  UsersIcon,
  ClockIcon,
  SmileIcon,
  ArrowRightIcon,
  QrIcon,
  BellIcon,
  QuoteIcon,
  SendIcon,
  CheckIcon,
} from "@/components/icons";
import { formatTime } from "@/lib/format";
import type { SeverityWeek } from "@/features/counsellor/dashboard-data";

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

type NotificationItem = {
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
};

type Affirmation = {
  id: string;
  message: string;
  createdAt: string;
};

type WalkIn = {
  id: string;
  startTime: string;
  status: string;
  student: { name: string };
};

function QuickCheckIn() {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const submit = useCallback(
    async (body: { code: string }) => {
      setBusy(true);
      setError(null);
      setResult(null);
      const res = await fetch("/api/appointments/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      setBusy(false);
      if (!res.ok || !json.success) {
        setError(json.message ?? "Check-in failed.");
        return;
      }
      setResult(json.message ?? "Checked in.");
      setCode("");
    },
    [],
  );

  return (
    <div className="flex flex-col gap-1.5">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (code.trim()) await submit({ code });
        }}
        className="flex items-center gap-2"
      >
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter code"
          autoComplete="off"
          spellCheck={false}
          className="min-w-0 flex-1 rounded-(--radius-input) border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand/20"
        />
        <button
          type="submit"
          disabled={busy || !code.trim()}
          className="h-9 shrink-0 rounded-(--radius-btn) bg-brand px-3 text-xs font-semibold text-white transition-colors hover:bg-brand-hover disabled:opacity-50"
        >
          {busy ? "..." : "Check in"}
        </button>
      </form>
      {error && (
        <p role="alert" className="text-xs text-red-ink">{error}</p>
      )}
      {result && (
        <p role="status" className="text-xs text-success-ink">{result}</p>
      )}
    </div>
  );
}

export type CounsellorDashboardClientProps = {
  todaysSessions: Session[];
  pendingRequests: Request[];
  sessionsThisWeek: number;
  severityTrend: SeverityWeek[];
  severityTotals: { MILD: number; MODERATE: number; CRITICAL: number };
  activeSuspensions: Array<{
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
  }>;
  firstName: string;
  live: LiveSession | null;
  next:
    | { student: { name: string }; startTime: string; appointmentDate: Date }
    | undefined;
  now: string;
  totalStudentsThisMonth: number;
  walkInsCount: number;
  completedToday: number;
  upcomingToday: number;
  nextSessionMinutes: number | null;
  notifications: NotificationItem[];
  unreadNotificationCount: number;
  recentAffirmations: Affirmation[];
  walkInsToday: WalkIn[];
};

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

function BotanicalSprig({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 220 180"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      <path
        d="M177 178C172 132 158 91 111 36"
        stroke="currentColor"
        className="text-ink-muted/20"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M145 105c-22 0-34-13-38-31 20 1 34 11 38 31Z"
        fill="currentColor"
        className="text-line"
      />
      <path
        d="M129 83c-20-5-29-18-27-35 18 4 28 16 27 35Z"
        fill="currentColor"
        className="text-line-strong"
      />
      <path
        d="M158 132c19-4 29-16 29-32-18 4-27 15-29 32Z"
        fill="currentColor"
        className="text-line"
      />
      <path
        d="M148 111c18 0 31-9 36-24-18-2-31 6-36 24Z"
        fill="currentColor"
        className="text-line-strong"
      />
      <path
        d="M117 59c-14-7-20-18-17-31 14 4 21 14 17 31Z"
        fill="currentColor"
        className="text-line"
      />
      <path
        d="M165 91c14-3 23-12 24-25-14 2-23 10-24 25Z"
        fill="currentColor"
        className="text-line-strong"
      />
    </svg>
  );
}

function Avatar({ name, className = "" }: { name: string; className?: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full bg-brand-tint text-xs font-bold text-brand-ink ${className ?? "h-9 w-9"}`}
    >
      {initials}
    </span>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function SessionTimeline({
  sessions,
  now,
}: {
  sessions: Session[];
  now: Date;
}) {
  return (
    <div className="flex flex-col">
      {sessions.map((s, i) => {
        const isCompleted = s.status === "COMPLETED";
        const isIn = (() => {
          if (s.status !== "APPROVED" || !s.checkedInAt) return false;
          const end = new Date(s.appointmentDate);
          const [eh, em] = s.endTime.split(":").map(Number);
          end.setUTCHours(eh, em, 0, 0);
          end.setUTCMinutes(end.getUTCMinutes() + 30);
          return now <= end;
        })();
        const isUpcoming = s.status === "APPROVED" && !isIn;

        return (
          <div key={s.id} className="flex items-start gap-3 py-3">
            {/* Time */}
            <span className="mt-0.5 w-[4.5rem] shrink-0 text-xs font-medium text-ink-muted">
              {formatTime(s.startTime)}
            </span>
            {/* Dot + line */}
            <div className="flex flex-col items-center pt-1.5">
              <span
                className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                  isCompleted
                    ? "bg-success"
                    : isIn
                      ? "bg-brand animate-pulse"
                      : "bg-brand-light"
                }`}
              />
              {i < sessions.length - 1 && (
                <span className="mt-1 h-6 w-px bg-line" />
              )}
            </div>
            {/* Content */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-semibold text-ink">
                  {s.student.name}
                </p>
                <span
                  className={`shrink-0 rounded-(--radius-pill) px-2 py-0.5 text-[0.6875rem] font-semibold ${
                    isCompleted
                      ? "bg-success-tint text-success-ink"
                      : isIn
                        ? "bg-brand-tint text-brand-ink"
                        : "bg-gold-tint text-gold-ink"
                  }`}
                >
                  {isCompleted ? "Completed" : isIn ? "In Session" : "Upcoming"}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-ink-muted">
                {isCompleted
                  ? "Session completed"
                  : isIn
                    ? "Currently in session"
                    : `${formatTime(s.startTime)} \u2013 ${formatTime(s.endTime)}`}
              </p>
            </div>
            {/* Action */}
            {isUpcoming && (
              <Link
                href="/counsellor/schedule"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-success-tint text-success-ink transition-colors hover:bg-success/20"
                title="Start Session"
              >
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            )}
            {isCompleted && (
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-success-tint text-success-ink">
                <CheckIcon className="h-4 w-4" />
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function CounsellorDashboardClient({
  todaysSessions,
  pendingRequests,
  firstName,
  live,
  next,
  now,
  totalStudentsThisMonth,
  walkInsCount,
  completedToday,
  upcomingToday,
  nextSessionMinutes,
  notifications,
  unreadNotificationCount,
  recentAffirmations,
  walkInsToday,
}: CounsellorDashboardClientProps) {
  const nowDate = new Date(now);
  const [breakActive, setBreakActive] = useState(false);

  const stats = [
    {
      icon: <CalendarIcon className="h-5 w-5" />,
      label: "Today's Sessions",
      value: todaysSessions.length,
      sub: `${completedToday} completed \u00b7 ${upcomingToday} upcoming`,
      iconBg: "bg-brand-tint text-brand-ink",
      href: "/counsellor/schedule",
      arrow: true,
    },
    {
      icon: <UsersIcon className="h-5 w-5" />,
      label: "Walk-ins",
      value: walkInsCount,
      sub: walkInsCount > 0 ? "Waiting for you" : "None today",
      iconBg: "bg-teal-tint text-teal",
      href: "/counsellor/walk-ins",
      arrow: true,
    },
    {
      icon: <ClockIcon className="h-5 w-5" />,
      label: "Next Session",
      value:
        nextSessionMinutes !== null ? `${nextSessionMinutes} min` : "--",
      sub: next
        ? `${next.student.name} \u00b7 ${formatTime(next.startTime)}`
        : "No upcoming",
      iconBg: "bg-gold text-gold-ink",
      href: "/counsellor/schedule",
      arrow: true,
    },
    {
      icon: <UsersIcon className="h-5 w-5" />,
      label: "Total Students",
      value: totalStudentsThisMonth,
      sub: "This month",
      iconBg: "bg-brand-tint text-brand-ink",
      href: "/counsellor/students",
      arrow: true,
    },
    {
      icon: <SmileIcon className="h-5 w-5" />,
      label: "Average Feedback",
      value: "4.8",
      sub: `From ${totalStudentsThisMonth} responses`,
      iconBg: "bg-success-tint text-success-ink",
      href: "/counsellor/history",
      arrow: true,
    },
  ];

  return (
    <motion.div
      className="flex flex-col gap-5"
      variants={stagger}
      initial="hidden"
      animate="visible"
    >
      {/* ── Hero Header ──────────────────────────────────────────────── */}
      <motion.header
        variants={fadeUp}
        className="relative overflow-hidden rounded-(--radius-card) bg-surface border border-line shadow-(--shadow-card) p-6 sm:p-8"
      >
        <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm text-ink-muted">
              {nowDate.toLocaleDateString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "long",
                timeZone: "UTC",
              })}
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-[-0.03em] text-ink-strong sm:text-4xl">
              Hello,{" "}
              <span className="text-brand">{firstName}</span>
            </h1>
            <p className="mt-1.5 text-sm text-ink-secondary">
              You make a difference. Every conversation matters.
            </p>
          </div>
          <div className="flex items-center gap-3 sm:mt-0">
            <p className="hidden text-right text-sm italic text-ink-muted sm:block">
              &ldquo;A calmer mind<br />
              builds a kinder tomorrow.&rdquo;
            </p>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-(--radius-pill) bg-success-tint px-3.5 py-2 text-sm font-semibold text-success-ink transition-colors hover:opacity-90"
            >
              <span className="h-2 w-2 rounded-full bg-success" />
              {live ? "In Session" : "Available"}
            </button>
            <button
              type="button"
              onClick={() => setBreakActive(!breakActive)}
              className={`inline-flex items-center gap-1.5 rounded-(--radius-btn) border px-3.5 py-2 text-sm font-semibold transition-colors ${
                breakActive
                  ? "border-gold-strong bg-gold text-gold-ink"
                  : "border-line bg-surface text-ink-secondary hover:bg-sunken"
              }`}
            >
              {breakActive ? "End Break" : "Start Break"}
            </button>
          </div>
        </div>
        <BotanicalSprig className="absolute -right-4 -top-4 h-[140px] w-[170px] opacity-50 sm:right-4 sm:top-0 sm:h-[180px] sm:w-[220px]" />
      </motion.header>

      {/* ── Notifications ─────────────────────────────────────────────── */}
      <motion.div variants={fadeUp}>
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <BellIcon className="h-5 w-5 text-brand-ink" />
              <h2 className="t-h2">Notifications</h2>
              {unreadNotificationCount > 0 && (
                <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-red px-2 text-xs font-bold text-white">
                  {unreadNotificationCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {unreadNotificationCount > 0 && (
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-ink hover:underline"
                >
                  <CheckIcon className="h-3.5 w-3.5" />
                  Mark all as read
                </button>
              )}
              <Link
                href="/counsellor/history"
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-ink hover:underline"
              >
                View all <ArrowRightIcon className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {notifications.length === 0 ? (
            <p className="t-meta mt-3">No notifications.</p>
          ) : (
            <ul className="mt-3 flex flex-col">
              {notifications.slice(0, 3).map((n) => (
                <li
                  key={n.id}
                  className="flex items-start gap-3 border-b border-line py-3 last:border-0 last:pb-0"
                >
                  <Avatar name={n.studentName} className="h-9 w-9" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink">
                      {n.studentName} has been suspended.
                    </p>
                    <p className="text-xs text-ink-muted">
                      {n.registerNumber && <>{n.registerNumber} \u00b7 </>}
                      {n.studentEmail} \u00b7{" "}
                      {new Date(n.startDate).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        timeZone: "UTC",
                      })}{" "}
                      \u2013{" "}
                      {new Date(n.endDate).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        timeZone: "UTC",
                      })}
                    </p>
                    {n.reason && (
                      <p className="mt-0.5 text-xs text-ink-muted">
                        Reason: {n.reason}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-xs text-ink-muted">
                      {timeAgo(n.createdAt)}
                    </span>
                    {!n.isRead && (
                      <span className="h-2 w-2 rounded-full bg-red" />
                    )}
                    <ArrowRightIcon className="h-3.5 w-3.5 text-ink-muted" />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </motion.div>

      {/* ── Stats Row ────────────────────────────────────────────────── */}
      <motion.div
        className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5"
        variants={stagger}
      >
        {stats.map((stat) => (
          <motion.div key={stat.label} variants={fadeUp}>
            <Link href={stat.href} className="block">
              <div className="flex items-start gap-3 rounded-(--radius-card) bg-surface border border-line p-4 shadow-(--shadow-card) transition-shadow hover:shadow-(--shadow-card-hover)">
                <span
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-[10px] ${stat.iconBg}`}
                >
                  {stat.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-2xl font-bold text-ink-strong">
                      {stat.value}
                    </p>
                    {stat.arrow && (
                      <ArrowRightIcon className="h-3.5 w-3.5 text-ink-muted" />
                    )}
                  </div>
                  <p className="text-xs font-semibold text-ink-secondary">
                    {stat.label}
                  </p>
                  <p className="text-[0.6875rem] text-ink-muted">{stat.sub}</p>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Main Grid: 3 columns ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[2fr_1.25fr_1fr] lg:items-stretch">
        {/* ── Left: Today's Schedule ──────────────────────────────────── */}
        <motion.div variants={fadeUp}>
          <Card className="h-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-brand-ink" />
                <h2 className="t-h3">Today&apos;s Schedule</h2>
              </div>
              <Link
                href="/counsellor/schedule"
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-ink hover:underline"
              >
                View All <ArrowRightIcon className="h-3 w-3" />
              </Link>
            </div>
            {todaysSessions.length === 0 ? (
              <p className="t-body mt-3">No sessions scheduled today.</p>
            ) : (
              <div className="mt-4">
                <SessionTimeline sessions={todaysSessions} now={nowDate} />
              </div>
            )}
          </Card>
        </motion.div>

        {/* ── Center Column ──────────────────────────────────────────── */}
        <div className="flex flex-col gap-5">
          {/* Scan QR for Walk-in */}
          <motion.div variants={fadeUp}>
            <Link href="/counsellor/qr-scanner" className="block">
              <Card>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <QrIcon className="h-4 w-4 text-brand-ink" />
                    <h2 className="t-h3">Scan Session QR</h2>
                  </div>
                  <ArrowRightIcon className="h-3.5 w-3.5 text-ink-muted" />
                </div>
                <p className="t-meta mt-1">
                  Scan the QR code displayed on the student&apos;s dashboard, or type their
                  code manually. This works for both booked sessions and walk-ins.
                </p>
                <div className="mt-3 flex items-start gap-4">
                  <div className="grid h-[4.5rem] w-[4.5rem] shrink-0 place-items-center rounded-lg bg-qr-bg border border-line">
                    <QrIcon className="h-10 w-10 text-qr-fg" />
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="mb-1.5 text-xs font-semibold text-ink-secondary">
                      Or enter their code
                    </p>
                    <QuickCheckIn />
                    <p className="mt-1.5 text-[0.6875rem] text-ink-muted">
                      Valid for today only
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          </motion.div>

          {/* Recent Walk-ins */}
          <motion.div variants={fadeUp}>
            <Card>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UsersIcon className="h-4 w-4 text-brand-ink" />
                  <h2 className="t-h3">Recent Walk-ins</h2>
                </div>
                <Link
                  href="/counsellor/walk-ins"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand-ink hover:underline"
                >
                  View All <ArrowRightIcon className="h-3 w-3" />
                </Link>
              </div>
              {walkInsToday.length === 0 ? (
                <div className="mt-3 flex items-start gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-sunken text-ink-muted">
                    <UsersIcon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      No recent walk-ins today.
                    </p>
                    <p className="mt-0.5 text-xs text-ink-muted">
                      Walk-ins will appear here once students check in.
                    </p>
                  </div>
                </div>
              ) : (
                <ul className="mt-3 flex flex-col">
                  {walkInsToday.slice(0, 3).map((w) => (
                    <li
                      key={w.id}
                      className="flex items-center gap-3 border-b border-line py-2.5 last:border-0 last:pb-0"
                    >
                      <Avatar name={w.student.name} className="h-8 w-8" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink">
                          {w.student.name}
                        </p>
                      </div>
                      <span className="text-xs text-ink-muted">
                        {formatTime(w.startTime)}
                      </span>
                      <span
                        className={`shrink-0 rounded-(--radius-pill) px-2 py-0.5 text-[0.6875rem] font-semibold ${
                          w.status === "COMPLETED"
                            ? "bg-success-tint text-success-ink"
                            : "bg-gold text-gold-ink"
                        }`}
                      >
                        {w.status === "COMPLETED" ? "Completed" : "Waiting"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </motion.div>
        </div>

        {/* ── Right Column: Your Availability ─────────────────────────── */}
        <motion.div variants={fadeUp}>
          <Card className="h-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClockIcon className="h-4 w-4 text-brand-ink" />
                <h2 className="t-h3">Your Availability</h2>
              </div>
              <Link
                href="/counsellor/availability"
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-ink hover:underline"
              >
                Manage <ArrowRightIcon className="h-3 w-3" />
              </Link>
            </div>
            <div className="mt-4 flex flex-col gap-3">
              <div className="rounded-xl bg-success-tint/40 p-4">
                <div className="flex items-center gap-2">
                  <ClockIcon className="h-4 w-4 text-success" />
                  <span className="text-sm font-semibold text-ink-secondary">
                    Today
                  </span>
                </div>
                <p className="mt-1.5 text-sm font-bold text-success-ink">
                  Available
                </p>
                <p className="mt-0.5 text-xs text-ink-muted">
                  9:00 AM \u2013 5:00 PM
                </p>
              </div>
              <div className="rounded-xl bg-gold/30 p-4">
                <div className="flex items-center gap-2">
                  <ClockIcon className="h-4 w-4 text-gold-strong" />
                  <span className="text-sm font-semibold text-ink-secondary">
                    Next Break
                  </span>
                </div>
                <p className="mt-1.5 text-sm font-bold text-ink">
                  Lunch Break
                </p>
                <p className="mt-0.5 text-xs text-ink-muted">
                  1:00 PM \u2013 1:30 PM
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* ── Quotes Row: full width ───────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-start">
        {/* Quote of the Day */}
        <motion.div variants={fadeUp}>
          <Card>
            <div className="flex items-center gap-2">
              <QuoteIcon className="h-5 w-5 text-brand-ink" />
              <h2 className="t-h2">Quote of the Day</h2>
            </div>
            {recentAffirmations.length > 0 && (
              <div className="mt-3">
                <p className="text-[0.9375rem] font-semibold text-ink">
                  &ldquo;{recentAffirmations[0].message}&rdquo;
                </p>
              </div>
            )}
            <p className="t-body mt-1">
              Share a positive thought with your students.
            </p>
            <QuoteOfDayForm />
          </Card>
        </motion.div>

        {/* Recent Quotes */}
        <motion.div variants={fadeUp}>
          <Card>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QuoteIcon className="h-4 w-4 text-brand-ink" />
                <h2 className="t-h3">Recent Quotes</h2>
              </div>
              <Link
                href="/counsellor/history"
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-ink hover:underline"
              >
                View All <ArrowRightIcon className="h-3 w-3" />
              </Link>
            </div>
            {recentAffirmations.length === 0 ? (
              <p className="t-meta mt-3">No quotes shared yet.</p>
            ) : (
              <ul className="mt-3 flex flex-col">
                {recentAffirmations.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-start gap-3 border-b border-line py-3 last:border-0 last:pb-0"
                  >
                    <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-tint text-brand-ink">
                      <QuoteIcon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink">
                        &ldquo;{a.message}&rdquo;
                      </p>
                      <p className="mt-0.5 text-xs text-ink-muted">
                        {new Date(a.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          timeZone: "UTC",
                        })}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
