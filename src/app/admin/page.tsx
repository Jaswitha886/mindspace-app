import { prisma } from "@/lib/prisma";
import { requirePageRole } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { PageTitle } from "@/components/ui/page-title";
import { EscalationInbox } from "@/features/admin/EscalationInbox";
import { toInboxItems } from "@/features/admin/escalation-view";
import { AnalyticsFilters } from "@/features/admin/AnalyticsFilters";
import { AdminSeverityTrendChart } from "@/features/admin/SeverityTrendChart";
import {
  counsellorLoad,
  departmentAnalytics,
  parseRange,
  severityAnalytics,
} from "@/features/admin/analytics";
import { INSUFFICIENT_DATA, MIN_COHORT } from "@/features/admin/suppression";
import { SEVERITY_META } from "@/features/notes/severity-meta";

// Admin analytics. Aggregate patterns only — no route here selects journal,
// mood, or session-note content. Every breakdown obeys the cohort floor.

const ymd = (d: Date) => d.toISOString().slice(0, 10);


export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{
    from?: string;
    to?: string;
    departmentId?: string;
    groupBy?: string;
  }>;
}) {
  const session = await requirePageRole("ADMIN");
  const sp = await searchParams;
  const range = parseRange(sp.from, sp.to);
  const groupBy = sp.groupBy === "month" ? "month" : "week";
  const departmentId = sp.departmentId || undefined;

  const [
    departments,
    escalations,
    escalationTotal,
    escalationUnread,
    depts,
    severity,
    load,
    totalSessions,
  ] = await Promise.all([
      prisma.department.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      prisma.notification.findMany({
        where: { recipientId: session.userId, type: "CRITICAL_SEVERITY" },
        orderBy: [{ isRead: "asc" }, { createdAt: "desc" }],
        take: 5, // a preview; the counts below are of the whole inbox
      }),
      prisma.notification.count({
        where: { recipientId: session.userId, type: "CRITICAL_SEVERITY" },
      }),
      prisma.notification.count({
        where: {
          recipientId: session.userId,
          type: "CRITICAL_SEVERITY",
          isRead: false,
        },
      }),
      departmentAnalytics(range, departmentId),
      severityAnalytics(range, groupBy, departmentId),
      counsellorLoad(range, groupBy, departmentId),
      prisma.appointment.count({
        where: {
          appointmentDate: { gte: range.from, lte: range.to },
          ...(departmentId ? { student: { departmentId } } : {}),
        },
      }),
    ]);

  const busiest = Math.max(1, ...load.filter((c) => c.reportable).map((c) => c.sessions));
  const anyLoadReportable = load.some((c) => c.reportable);
  const anyDeptReportable = depts.some((d) => d.reportable);

  // A platform-wide total singles nobody out and isn't suppressed. But the
  // moment a department filter is applied, that same "total" IS a department
  // breakdown — "Biotechnology: 5 sessions" over a cohort of 2 is exactly the
  // number the rule exists to withhold. So the totals follow the filter.
  const scopedReportable = departmentId ? (depts[0]?.reportable ?? false) : true;

  return (
    <div className="flex flex-col gap-5">
      <PageTitle sub="Aggregate patterns across departments and counsellors. Note contents stay private to the counsellor and student — only counts and severity distributions surface here.">
        Analytics Overview
      </PageTitle>

      <Card tone="sunken">
        <AnalyticsFilters
          departments={departments}
          from={ymd(range.from)}
          to={ymd(range.to)}
          departmentId={departmentId}
          groupBy={groupBy}
        />
        <p className="t-meta mt-3">
          Any breakdown covering fewer than {MIN_COHORT} students reads{" "}
          &ldquo;{INSUFFICIENT_DATA}&rdquo; — with a handful of students behind a
          bar, a split identifies people.
        </p>
      </Card>

      {/* Critical severity is an action trigger — it stays above the aggregates. */}
      <Card>
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="t-h2">Critical Escalations</h2>
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
          items={await toInboxItems(escalations)}
        />
      </Card>

      {/* Totals — suppressed only when a department filter turns them into a
          breakdown of a small cohort (see scopedReportable). */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <Card tone="plum">
          <p className="text-[0.9375rem] font-semibold text-ink-secondary">
            Total Sessions
          </p>
          {scopedReportable ? (
            <>
              <p className="t-figure mt-1 text-brand-ink">
                {totalSessions.toLocaleString()}
              </p>
              <p className="t-meta mt-2">in the selected window</p>
            </>
          ) : (
            <p className="mt-2 text-[0.9375rem] font-semibold text-ink-muted">
              {INSUFFICIENT_DATA}
            </p>
          )}
        </Card>
        <Card>
          <p className="text-[0.9375rem] font-semibold text-ink-secondary">
            Session Notes
          </p>
          {scopedReportable ? (
            <>
              <p className="t-figure mt-1 text-ink-strong">
                {(
                  severity.totals.MILD +
                  severity.totals.MODERATE +
                  severity.totals.CRITICAL
                ).toLocaleString()}
              </p>
              <p className="t-meta mt-2">written in this window</p>
            </>
          ) : (
            <p className="mt-2 text-[0.9375rem] font-semibold text-ink-muted">
              {INSUFFICIENT_DATA}
            </p>
          )}
        </Card>
        {/* Counts counsellor accounts, not students — no cohort to protect. */}
        <Card tone="sunken">
          <p className="text-[0.9375rem] font-semibold text-ink-secondary">
            Active Counsellors
          </p>
          <p className="t-figure mt-1 text-ink-strong">
            {load.filter((c) => c.isActive).length}
          </p>
          <p className="t-meta mt-2">accounts currently enabled</p>
        </Card>
      </div>

      {/* Severity analytics. */}
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

      {/* Department-wise analytics. */}
      <Card>
        <h2 className="t-h2">Department Analytics</h2>
        <p className="t-body mt-1">Session volume and severity split per department.</p>
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
                  <th scope="col" className="py-2 text-xs font-semibold text-ink-muted">
                    Department
                  </th>
                  <th scope="col" className="py-2 text-right text-xs font-semibold text-ink-muted">
                    Sessions
                  </th>
                  <th scope="col" className="py-2 text-right text-xs font-semibold text-ink-muted">
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
                {depts.map((d) => (
                  <tr key={d.id} className="border-b border-line last:border-0">
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
                      <td colSpan={5} className="py-3 text-right text-[0.8125rem] text-ink-muted">
                        {INSUFFICIENT_DATA}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Per-counsellor load. */}
      <Card>
        <h2 className="t-h2">Counsellor Load</h2>
        <p className="t-body mt-1">
          Sessions in this window, and the average per {groupBy}.
        </p>
        {!anyLoadReportable ? (
          <div className="py-10 text-center">
            <p className="t-meta">{INSUFFICIENT_DATA}</p>
            <p className="t-meta mt-1">
              No counsellor has seen {MIN_COHORT} or more students in this window.
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
                    <span
                      aria-hidden
                      className="hidden h-2 w-40 shrink-0 overflow-hidden rounded-(--radius-pill) bg-sunken sm:block"
                    >
                      <span
                        className="block h-full rounded-(--radius-pill) bg-brand-light"
                        style={{ width: `${(c.sessions / busiest) * 100}%` }}
                      />
                    </span>
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
    </div>
  );
}
