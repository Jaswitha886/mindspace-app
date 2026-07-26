"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, type Variants } from "framer-motion";
import { Card } from "@/components/ui/card";
import { EscalationInbox, type InboxItem } from "@/features/admin/EscalationInbox";
import { AnalyticsFilters } from "@/features/admin/AnalyticsFilters";
import { AdminSeverityTrendChart } from "@/features/admin/SeverityTrendChart";
import { SEVERITY_META } from "@/features/notes/severity-meta";
import { INSUFFICIENT_DATA, MIN_COHORT } from "@/features/admin/suppression";
import type {
  DeptRow,
  SeverityTrend,
  CounsellorLoad,
} from "@/features/admin/analytics";
import type { Department } from "@prisma/client";

/* ─── animation helpers ────────────────────────────────────────────── */

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

/* ─── animated counter ─────────────────────────────────────────────── */

function AnimatedNumber({ value, duration = 1200 }: { value: number; duration?: number }) {
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
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
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

/* ─── animated progress bar ────────────────────────────────────────── */

function AnimatedBar({
  ratio,
  className = "",
}: {
  ratio: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20px" });

  return (
    <span
      aria-hidden
      ref={ref}
      className={`hidden h-2 w-40 shrink-0 overflow-hidden rounded-(--radius-pill) bg-sunken sm:block ${className}`}
    >
      <span
        className="block h-full rounded-(--radius-pill) bg-gradient-to-r from-brand-light to-teal transition-[width] duration-700 ease-out"
        style={{ width: inView ? `${ratio * 100}%` : "0%" }}
      />
    </span>
  );
}

/* ─── section wrapper with scroll-triggered fade ───────────────────── */

function Section({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── main component ───────────────────────────────────────────────── */

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
}: AdminDashboardClientProps) {
  const sessionNotesCount =
    severity.totals.MILD + severity.totals.MODERATE + severity.totals.CRITICAL;

  return (
    <motion.div
      className="flex flex-col gap-5"
      variants={stagger}
      initial="hidden"
      animate="visible"
    >
      {/* ── Filters ─────────────────────────────────────────────────── */}
      <motion.div variants={fadeUp}>
        <Card tone="sunken">
          <AnalyticsFilters
            departments={departments}
            from={filters.from}
            to={filters.to}
            departmentId={filters.departmentId}
            groupBy={filters.groupBy}
          />
          <p className="t-meta mt-3">
            Any breakdown covering fewer than {MIN_COHORT} students reads{" "}
            &ldquo;{INSUFFICIENT_DATA}&rdquo; — with a handful of students behind a
            bar, a split identifies people.
          </p>
        </Card>
      </motion.div>

      {/* ── Escalations ─────────────────────────────────────────────── */}
      <motion.div variants={fadeUp}>
        <Card>
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="flex items-center gap-3 t-h2">
              Critical Escalations
              {escalationUnread > 0 && (
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pink opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-pink" />
                </span>
              )}
            </h2>
            <a
              href="/admin/notifications"
              className="text-sm font-semibold text-brand-ink hover:underline"
            >
              Open inbox
            </a>
          </div>
          <p className="t-body mt-1 mb-3">
            Raised the moment a counsellor flags a session critical.
          </p>
          <EscalationInbox
            total={escalationTotal}
            unread={escalationUnread}
            items={escalations}
          />
        </Card>
      </motion.div>

      {/* ── Stat cards ──────────────────────────────────────────────── */}
      <motion.div
        className="grid grid-cols-1 gap-5 sm:grid-cols-3"
        variants={stagger}
      >
        <motion.div variants={fadeUp}>
          <Card tone="plum">
            <p className="text-[0.9375rem] font-semibold text-ink-secondary">
              Total Sessions
            </p>
            {scopedReportable ? (
              <>
                <p className="t-figure mt-1 text-brand-ink">
                  <AnimatedNumber value={totalSessions} />
                </p>
                <p className="t-meta mt-2">in the selected window</p>
              </>
            ) : (
              <p className="mt-2 text-[0.9375rem] font-semibold text-ink-muted">
                {INSUFFICIENT_DATA}
              </p>
            )}
          </Card>
        </motion.div>

        <motion.div variants={fadeUp}>
          <Card>
            <p className="text-[0.9375rem] font-semibold text-ink-secondary">
              Session Notes
            </p>
            {scopedReportable ? (
              <>
                <p className="t-figure mt-1 text-ink-strong">
                  <AnimatedNumber value={sessionNotesCount} />
                </p>
                <p className="t-meta mt-2">written in this window</p>
              </>
            ) : (
              <p className="mt-2 text-[0.9375rem] font-semibold text-ink-muted">
                {INSUFFICIENT_DATA}
              </p>
            )}
          </Card>
        </motion.div>

        <motion.div variants={fadeUp}>
          <Card tone="sunken">
            <p className="text-[0.9375rem] font-semibold text-ink-secondary">
              Active Counsellors
            </p>
            <p className="t-figure mt-1 text-teal">
              <AnimatedNumber value={load.filter((c) => c.isActive).length} />
            </p>
            <p className="t-meta mt-2">accounts currently enabled</p>
          </Card>
        </motion.div>
      </motion.div>

      {/* ── Severity trend ──────────────────────────────────────────── */}
      <Section>
        <Card>
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <div>
              <h2 className="t-h2">Severity Trend</h2>
              <p className="t-body mt-1">
                Session notes by {groupBy}
                {departmentId
                  ? ` · ${departments.find((d) => d.id === departmentId)?.name}`
                  : " · all departments"}
              </p>
            </div>
            {severity.reportable && (
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
                      {severity.totals[s.key]}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
          <div className="mt-4">
            {severity.reportable ? (
              <AdminSeverityTrendChart data={severity.buckets} />
            ) : (
              <div className="py-12 text-center">
                <p className="t-meta">{INSUFFICIENT_DATA}</p>
                <p className="t-meta mt-1">
                  {severity.students === 0
                    ? "No session notes in this window."
                    : `Only ${severity.students} student${severity.students === 1 ? "" : "s"} behind these notes — fewer than ${MIN_COHORT}.`}
                </p>
              </div>
            )}
          </div>
        </Card>
      </Section>

      {/* ── Department analytics ─────────────────────────────────────── */}
      <Section>
        <Card>
          <h2 className="t-h2">Department Analytics</h2>
          <p className="t-body mt-1">
            Session volume and severity split per department.
          </p>
          {!anyDeptReportable ? (
            <div className="py-10 text-center">
              <p className="t-meta">{INSUFFICIENT_DATA}</p>
              <p className="t-meta mt-1">
                No department has {MIN_COHORT} or more students in this window.
              </p>
            </div>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[34rem] border-collapse text-left">
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
                <motion.tbody variants={stagger} initial="hidden" animate="visible">
                  {depts.map((d) => (
                    <motion.tr
                      key={d.id}
                      variants={fadeUp}
                      className="border-b border-line last:border-0"
                    >
                      <th
                        scope="row"
                        className="py-3 text-[0.9375rem] font-semibold text-ink"
                      >
                        {d.name}
                      </th>
                      {d.reportable ? (
                        <>
                          <td className="py-3 text-right text-[0.9375rem] font-semibold text-ink">
                            {d.sessions}
                          </td>
                          <td className="py-3 text-right text-[0.9375rem] text-ink-secondary">
                            {d.students}
                          </td>
                          {SEVERITY_META.map((s) => (
                            <td
                              key={s.key}
                              className="py-3 text-right text-[0.9375rem] text-ink-secondary"
                            >
                              {d.severity[s.key]}
                            </td>
                          ))}
                        </>
                      ) : (
                        <td
                          colSpan={5}
                          className="py-3 text-right text-[0.8125rem] text-ink-muted"
                        >
                          {INSUFFICIENT_DATA}
                        </td>
                      )}
                    </motion.tr>
                  ))}
                </motion.tbody>
              </table>
            </div>
          )}
        </Card>
      </Section>

      {/* ── Counsellor load ─────────────────────────────────────────── */}
      <Section>
        <Card>
          <h2 className="t-h2">Counsellor Load</h2>
          <p className="t-body mt-1">
            Sessions in this window, and the average per {groupBy}.
          </p>
          {!anyLoadReportable ? (
            <div className="py-10 text-center">
              <p className="t-meta">{INSUFFICIENT_DATA}</p>
              <p className="t-meta mt-1">
                No counsellor has seen {MIN_COHORT} or more students in this
                window.
              </p>
            </div>
          ) : (
            <ul className="mt-3 flex flex-col">
              {load.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center gap-4 border-b border-line py-3 first:pt-0 last:border-0 last:pb-0"
                >
                  <span className="min-w-0 flex-1 truncate text-[0.9375rem] font-semibold text-ink">
                    {c.name}
                    {!c.isActive && (
                      <span className="ml-2 rounded-(--radius-pill) bg-sunken px-2 py-0.5 text-xs font-semibold text-ink-muted">
                        Deactivated
                      </span>
                    )}
                  </span>
                  {c.reportable ? (
                    <>
                      <AnimatedBar ratio={c.sessions / busiest} />
                      <span className="w-24 shrink-0 text-right text-[0.8125rem] text-ink-muted">
                        {c.perPeriod}/{groupBy}
                      </span>
                      <span className="w-8 shrink-0 text-right text-[0.9375rem] font-semibold text-ink">
                        {c.sessions}
                      </span>
                    </>
                  ) : (
                    <span className="shrink-0 text-[0.8125rem] text-ink-muted">
                      {INSUFFICIENT_DATA}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </Section>
    </motion.div>
  );
}
