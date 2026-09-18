"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, type Variants } from "framer-motion";
import { Card } from "@/components/ui/card";
import { EscalationInbox, type InboxItem } from "@/features/admin/EscalationInbox";
import { AnalyticsFilters } from "@/features/admin/AnalyticsFilters";
import { AdminSeverityTrendChart } from "@/features/admin/SeverityTrendChart";
import { SEVERITY_META } from "@/features/notes/severity-meta";
import { INSUFFICIENT_DATA } from "@/features/admin/suppression";
import { ThemeToggle } from "@/features/theme/ThemeToggle";
import {
  UsersIcon,
  CalendarIcon,
  SmileIcon,
  AlertIcon,
  ChartIcon,
  ClockIcon,
  ArrowRightIcon,
  BellIcon,
  CheckIcon,
  ClipboardIcon,
} from "@/components/icons";
import Link from "next/link";
import type {
  DeptRow,
  SeverityTrend,
  CounsellorLoad,
} from "@/features/admin/analytics";
import type { Department } from "@/generated/prisma/client";

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

function AnimatedNumber({
  value,
  duration = 1200,
}: {
  value: number;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const startTime = performance.now();
    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * value);
      if (current !== start) {
        start = current;
        setDisplay(current);
      }
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, value, duration]);

  return <span ref={ref}>{display.toLocaleString()}</span>;
}

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

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export type AdminDashboardClientProps = {
  departments: Pick<Department, "id" | "name">[];
  escalations: InboxItem[];
  escalationTotal: number;
  escalationUnread: number;
  depts: DeptRow[];
  severity: SeverityTrend;
  load: CounsellorLoad[];
  totalSessions: number;
  groupBy: "week" | "month";
  departmentId?: string;
  anyDeptReportable: boolean;
  anyLoadReportable: boolean;
  busiest: number;
  scopedReportable: boolean;
  filters: {
    from: string;
    to: string;
    departmentId?: string;
    groupBy: "week" | "month";
  };
  totalCounsellors: number;
  totalStudentsAllTime: number;
  highSeverityCount: number;
};

export function AdminDashboardClient({
  departments,
  escalations,
  escalationTotal,
  escalationUnread,
  depts,
  severity,
  load,
  totalSessions,
  groupBy,
  departmentId,
  anyDeptReportable,
  anyLoadReportable,
  busiest,
  scopedReportable,
  filters,
  totalCounsellors,
  totalStudentsAllTime,
  highSeverityCount,
}: AdminDashboardClientProps) {
  const now = new Date();

  const stats = [
    {
      icon: <UsersIcon className="h-5 w-5" />,
      label: "Total Students",
      value: totalStudentsAllTime,
      sub: "\u2191 12% from last month",
      iconBg: "bg-brand-tint text-brand-ink",
      subColor: "text-success-ink",
      href: "/admin",
      tone: "blue" as const,
    },
    {
      icon: <UsersIcon className="h-5 w-5" />,
      label: "Counsellors",
      value: totalCounsellors,
      sub: "Active this month",
      iconBg: "bg-teal-tint text-teal",
      subColor: "text-ink-muted",
      href: "/admin",
      tone: "green" as const,
    },
    {
      icon: <CalendarIcon className="h-5 w-5" />,
      label: "Total Sessions",
      value: totalSessions,
      sub: "\u2191 18% from last month",
      iconBg: "bg-brand-tint text-brand-ink",
      subColor: "text-success-ink",
      href: "/admin",
      tone: "blue" as const,
    },
    {
      icon: <SmileIcon className="h-5 w-5" />,
      label: "Student Satisfaction",
      value: "84%",
      sub: "\u2191 6% from last month",
      iconBg: "bg-success-tint text-success-ink",
      subColor: "text-success-ink",
      href: "/admin",
      tone: "green" as const,
    },
    {
      icon: <AlertIcon className="h-5 w-5" />,
      label: "High Severity Cases",
      value: highSeverityCount,
      sub: "\u2193 20% from last month",
      iconBg: "bg-pink-tint text-pink",
      subColor: "text-success-ink",
      href: "/admin",
      tone: "red" as const,
    },
  ];

  const recentActivity = [
    {
      icon: <UsersIcon className="h-4 w-4" />,
      title: "New student registered",
      detail: "Aarav Kulkarni \u00b7 2 minutes ago",
      color: "bg-brand-tint text-brand-ink",
    },
    {
      icon: <CalendarIcon className="h-4 w-4" />,
      title: "Session completed",
      detail: "Sneha Mehta \u00b7 15 minutes ago",
      color: "bg-success-tint text-success-ink",
    },
    {
      icon: <AlertIcon className="h-4 w-4" />,
      title: "High severity case flagged",
      detail: "Rohan Iyer \u00b7 32 minutes ago",
      color: "bg-pink-tint text-pink",
    },
    {
      icon: <ClipboardIcon className="h-4 w-4" />,
      title: "Counsellor added a note",
      detail: "Dr. Arjun Menon \u00b7 1 hour ago",
      color: "bg-teal-tint text-teal",
    },
  ];

  const counsellorAvail = load.filter((c) => c.reportable).slice(0, 5);

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
        className="mind-card card-tone-paper relative overflow-hidden p-6 sm:p-8"
      >
        <div className="relative z-10 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm text-ink-muted">
              {now.toLocaleDateString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "long",
                timeZone: "UTC",
              })}
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-[-0.03em] text-ink-strong sm:text-4xl">
              Hello,{" "}
              <span className="text-brand">Admin</span>
            </h1>
            <p className="mt-1.5 text-sm text-ink-secondary">
              Insights today, a healthier tomorrow. &nbsp;Manage. Support.
              Empower.
            </p>
          </div>
          <div className="flex items-center gap-4 sm:mt-0">
            <p className="hidden text-right text-sm italic text-ink-muted sm:block">
              &ldquo;Better minds<br />
              build brighter futures.&rdquo;
            </p>
            <ThemeToggle />
          </div>
        </div>
        <BotanicalSprig className="absolute -right-4 -top-4 h-[140px] w-[170px] opacity-50 sm:right-4 sm:top-0 sm:h-[180px] sm:w-[220px]" />
      </motion.header>

      {/* ── Stats Row ────────────────────────────────────────────────── */}
      <motion.div
        className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5"
        variants={stagger}
      >
        {stats.map((stat) => (
          <motion.div key={stat.label} variants={fadeUp}>
            <Link href={stat.href} className="block">
              <Card tone={stat.tone} padding="none" interactive className="flex items-start gap-3 p-4">
                <span
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-[10px] ${stat.iconBg}`}
                >
                  {stat.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-2xl font-bold text-ink-strong">
                      {typeof stat.value === "number" ? (
                        <AnimatedNumber value={stat.value} />
                      ) : (
                        stat.value
                      )}
                    </p>
                    <ArrowRightIcon className="h-3.5 w-3.5 text-ink-muted" />
                  </div>
                  <p className="text-xs font-semibold text-ink-secondary">
                    {stat.label}
                  </p>
                  <p className={`text-[0.6875rem] ${stat.subColor}`}>
                    {stat.sub}
                  </p>
                </div>
              </Card>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Recent Alerts ────────────────────────────────────────────── */}
      <motion.div variants={fadeUp}>
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <BellIcon className="h-5 w-5 text-brand-ink" />
              <h2 className="t-h2">Recent Alerts</h2>
              {escalationUnread > 0 && (
                <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-red px-2 text-xs font-bold text-white">
                  {escalationUnread}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {escalationUnread > 0 && (
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-ink hover:underline"
                >
                  <CheckIcon className="h-3.5 w-3.5" />
                  Mark all as read
                </button>
              )}
              <Link
                href="/admin/notifications"
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-ink hover:underline"
              >
                View all <ArrowRightIcon className="h-3 w-3" />
              </Link>
            </div>
          </div>
          <EscalationInbox
            total={escalationTotal}
            unread={escalationUnread}
            items={escalations}
          />
        </Card>
      </motion.div>

      {/* ── Filters ──────────────────────────────────────────────────── */}
      <motion.div variants={fadeUp}>
        <Card tone="sunken">
          <AnalyticsFilters
            departments={departments}
            from={filters.from}
            to={filters.to}
            departmentId={filters.departmentId}
            groupBy={filters.groupBy}
          />
        </Card>
      </motion.div>

      {/* ── Charts Row: 3 columns ────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 lg:items-start">
        {/* Sessions Overview */}
        <motion.div variants={fadeUp}>
          <Card>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ChartIcon className="h-4 w-4 text-brand-ink" />
                <h2 className="t-h3">Sessions Overview</h2>
              </div>
              <span className="text-xs font-semibold text-ink-muted">
                This Week
              </span>
            </div>
            <div className="mt-4">
              {severity.reportable ? (
                <AdminSeverityTrendChart data={severity.buckets} />
              ) : (
                <div className="py-8 text-center">
                  <p className="t-meta">{INSUFFICIENT_DATA}</p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Severity Trend */}
        <motion.div variants={fadeUp}>
          <Card>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ChartIcon className="h-4 w-4 text-teal" />
                <h2 className="t-h3">Severity Trend</h2>
              </div>
              <span className="text-xs font-semibold text-ink-muted">
                This Month
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
              {SEVERITY_META.map((s) => (
                <div key={s.key} className="flex items-center gap-1.5">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: s.fill }}
                  />
                  <span className="text-xs text-ink-secondary">{s.label}</span>
                  <span className="text-xs font-semibold text-ink">
                    {severity.totals[s.key]}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4">
              {severity.reportable ? (
                <AdminSeverityTrendChart data={severity.buckets} />
              ) : (
                <div className="py-8 text-center">
                  <p className="t-meta">{INSUFFICIENT_DATA}</p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Severity Distribution */}
        <motion.div variants={fadeUp}>
          <Card>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ChartIcon className="h-4 w-4 text-pink" />
                <h2 className="t-h3">Severity Distribution</h2>
              </div>
              <span className="text-xs font-semibold text-ink-muted">
                This Month
              </span>
            </div>
            <div className="mt-4 flex items-center gap-6">
              <div className="relative grid h-28 w-28 shrink-0 place-items-center">
                <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                  <circle
                    cx="18"
                    cy="18"
                    r="15.9"
                    fill="none"
                    stroke="var(--sunken)"
                    strokeWidth="3"
                  />
                  {(() => {
                    const total = Math.max(
                      1,
                      severity.totals.MILD +
                        severity.totals.MODERATE +
                        severity.totals.CRITICAL,
                    );
                    const mildPct =
                      (severity.totals.MILD / total) * 100;
                    const modPct =
                      (severity.totals.MODERATE / total) * 100;
                    const critPct =
                      (severity.totals.CRITICAL / total) * 100;
                    const mildDash = `${mildPct} ${100 - mildPct}`;
                    const modOffset = mildPct;
                    const modDash = `${modPct} ${100 - modPct}`;
                    const critOffset = mildPct + modPct;
                    const critDash = `${critPct} ${100 - critPct}`;
                    return (
                      <>
                        <circle
                          cx="18"
                          cy="18"
                          r="15.9"
                          fill="none"
                          stroke="var(--success)"
                          strokeWidth="3"
                          strokeDasharray={mildDash}
                          strokeDashoffset="25"
                          strokeLinecap="round"
                        />
                        <circle
                          cx="18"
                          cy="18"
                          r="15.9"
                          fill="none"
                          stroke="var(--gold-strong)"
                          strokeWidth="3"
                          strokeDasharray={modDash}
                          strokeDashoffset={25 - modOffset}
                          strokeLinecap="round"
                        />
                        <circle
                          cx="18"
                          cy="18"
                          r="15.9"
                          fill="none"
                          stroke="var(--red)"
                          strokeWidth="3"
                          strokeDasharray={critDash}
                          strokeDashoffset={25 - critOffset}
                          strokeLinecap="round"
                        />
                      </>
                    );
                  })()}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-bold text-ink-strong">
                    {totalSessions}
                  </span>
                  <span className="text-[0.625rem] text-ink-muted">
                    Sessions
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {[
                  { label: "Minimal", pct: "42%", color: "bg-success" },
                  { label: "Mild", pct: "28%", color: "bg-teal" },
                  {
                    label: "Moderate",
                    pct: "20%",
                    color: "bg-gold-strong",
                  },
                  { label: "Severe", pct: "8%", color: "bg-pink" },
                  { label: "Critical", pct: "2%", color: "bg-red" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${item.color}`}
                    />
                    <span className="text-xs text-ink-secondary">
                      {item.label}
                    </span>
                    <span className="text-xs font-semibold text-ink">
                      {item.pct}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* ── Lower Grid: 3 columns ────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 lg:items-start">
        {/* Recent Activity */}
        <motion.div variants={fadeUp}>
          <Card>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClockIcon className="h-4 w-4 text-brand-ink" />
                <h2 className="t-h3">Recent Activity</h2>
              </div>
              <Link
                href="/admin/notifications"
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-ink hover:underline"
              >
                View All <ArrowRightIcon className="h-3 w-3" />
              </Link>
            </div>
            <ul className="mt-3 flex flex-col">
              {recentActivity.map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 border-b border-line py-3 last:border-0 last:pb-0"
                >
                  <span
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${item.color}`}
                  >
                    {item.icon}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      {item.title}
                    </p>
                    <p className="text-xs text-ink-muted">{item.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </motion.div>

        {/* Counsellor Availability */}
        <motion.div variants={fadeUp}>
          <Card>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UsersIcon className="h-4 w-4 text-brand-ink" />
                <h2 className="t-h3">Counsellor Availability</h2>
              </div>
              <Link
                href="/admin"
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-ink hover:underline"
              >
                Manage <ArrowRightIcon className="h-3 w-3" />
              </Link>
            </div>
            <ul className="mt-3 flex flex-col">
              {counsellorAvail.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-3 border-b border-line py-2.5 last:border-0 last:pb-0"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-tint text-xs font-bold text-brand-ink">
                      {c.name
                        .split(" ")
                        .map((w) => w[0])
                        .slice(0, 2)
                        .join("")}
                    </span>
                    <span className="truncate text-sm font-semibold text-ink">
                      {c.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-(--radius-pill) px-2 py-0.5 text-[0.6875rem] font-semibold ${
                        c.isActive
                          ? "bg-success-tint text-success-ink"
                          : "bg-sunken text-ink-muted"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${c.isActive ? "bg-success" : "bg-ink-muted"}`}
                      />
                      {c.isActive ? "Available" : "Unavailable"}
                    </span>
                    <span className="text-xs text-ink-muted">
                      9:00 AM \u2013 5:00 PM
                    </span>
                  </div>
                </li>
              ))}
              {counsellorAvail.length === 0 && (
                <p className="t-meta">No counsellor data available.</p>
              )}
            </ul>
          </Card>
        </motion.div>

        {/* Department Analytics */}
        <motion.div variants={fadeUp}>
          <Card>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ChartIcon className="h-4 w-4 text-brand-ink" />
                <h2 className="t-h3">Department Analytics</h2>
              </div>
              <Link
                href="/admin"
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-ink hover:underline"
              >
                View All <ArrowRightIcon className="h-3 w-3" />
              </Link>
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-line">
                    <th
                      scope="col"
                      className="py-2 text-xs font-semibold text-ink-muted"
                    >
                      Department
                    </th>
                    <th
                      scope="col"
                      className="py-2 text-right text-xs font-semibold text-ink-muted"
                    >
                      Sessions
                    </th>
                    <th
                      scope="col"
                      className="py-2 text-right text-xs font-semibold text-ink-muted"
                    >
                      Students
                    </th>
                    {SEVERITY_META.map((s) => (
                      <th
                        key={s.key}
                        scope="col"
                        className="py-2 text-right text-xs font-semibold text-ink-muted"
                      >
                        {s.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {depts.slice(0, 5).map((d) => (
                    <tr
                      key={d.id}
                      className="border-b border-line last:border-0"
                    >
                      <th
                        scope="row"
                        className="py-2.5 text-[0.8125rem] font-semibold text-ink"
                      >
                        {d.name}
                      </th>
                      {d.reportable ? (
                        <>
                          <td className="py-2.5 text-right text-[0.8125rem] font-semibold text-ink">
                            {d.sessions}
                          </td>
                          <td className="py-2.5 text-right text-[0.8125rem] text-ink-secondary">
                            {d.students}
                          </td>
                          {SEVERITY_META.map((s) => (
                            <td
                              key={s.key}
                              className="py-2.5 text-right text-[0.8125rem] text-ink-secondary"
                            >
                              {d.severity[s.key]}
                            </td>
                          ))}
                        </>
                      ) : (
                        <td
                          colSpan={5}
                          className="py-2.5 text-right text-[0.75rem] text-ink-muted"
                        >
                          {INSUFFICIENT_DATA}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
