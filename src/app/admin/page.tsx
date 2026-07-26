import { prisma } from "@/lib/prisma";
import { requirePageRole } from "@/lib/auth";
import { PageTitle } from "@/components/ui/page-title";
import { toInboxItems } from "@/features/admin/escalation-view";
import {
  counsellorLoad,
  departmentAnalytics,
  parseRange,
  severityAnalytics,
} from "@/features/admin/analytics";
import { OnboardingSlides } from "@/features/student/OnboardingSlides";
import { AdminDashboardClient } from "@/features/admin/AdminDashboardClient";

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
        take: 5,
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
  const scopedReportable = departmentId ? (depts[0]?.reportable ?? false) : true;

  const inboxItems = await toInboxItems(escalations);

  return (
    <div className="flex flex-col gap-5">
      <OnboardingSlides role="admin" />

      <PageTitle sub="Aggregate patterns across departments and counsellors. Note contents stay private to the counsellor and student — only counts and severity distributions surface here.">
        Analytics Overview
      </PageTitle>

      <AdminDashboardClient
        departments={departments}
        escalations={inboxItems}
        escalationTotal={escalationTotal}
        escalationUnread={escalationUnread}
        depts={depts}
        severity={severity}
        load={load}
        totalSessions={totalSessions}
        groupBy={groupBy}
        departmentId={departmentId}
        anyDeptReportable={anyDeptReportable}
        anyLoadReportable={anyLoadReportable}
        busiest={busiest}
        scopedReportable={scopedReportable}
        filters={{
          from: ymd(range.from),
          to: ymd(range.to),
          departmentId,
          groupBy,
        }}
      />
    </div>
  );
}
