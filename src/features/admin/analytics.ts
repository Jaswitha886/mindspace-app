import { prisma } from "@/lib/prisma";
import type { SeverityLevel } from "@prisma/client";
import { cohortIsReportable, cohortSize } from "@/features/admin/suppression";

// Admin analytics. Two rules run through everything here:
//   1. Never select note *content* — admins see counts, never words.
//   2. Every breakdown is sized on its own cohort of distinct students and
//      suppressed under the floor (see suppression.ts). Platform-wide totals
//      are not breakdowns and are not suppressed — they single nobody out.

export type Range = { from: Date; to: Date };

/** Default window: the last 30 days, inclusive of today. */
export function defaultRange(): Range {
  const to = new Date();
  to.setUTCHours(23, 59, 59, 999);
  const from = new Date(to);
  from.setUTCDate(from.getUTCDate() - 29);
  from.setUTCHours(0, 0, 0, 0);
  return { from, to };
}

export function parseRange(from?: string, to?: string): Range {
  const d = defaultRange();
  if (from) {
    const f = new Date(`${from}T00:00:00.000Z`);
    if (!Number.isNaN(f.getTime())) d.from = f;
  }
  if (to) {
    const t = new Date(`${to}T23:59:59.999Z`);
    if (!Number.isNaN(t.getTime())) d.to = t;
  }
  return d;
}

export type DeptRow = {
  id: string;
  name: string;
  sessions: number;
  students: number;
  reportable: boolean;
  severity: Record<SeverityLevel, number>;
};

/**
 * Session volume and severity split per department, over a window.
 *
 * Department lives on User, so the join runs Appointment → student →
 * department. A department's cohort is its distinct students *appearing in
 * this window* — not its enrolment: a department of 400 with 2 students in
 * counselling this month is still a group of 2, and publishing their severity
 * split would identify them.
 */
export async function departmentAnalytics(
  range: Range,
  departmentId?: string,
): Promise<DeptRow[]> {
  const [departments, appointments] = await Promise.all([
    prisma.department.findMany({
      where: departmentId ? { id: departmentId } : {},
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.appointment.findMany({
      where: {
        appointmentDate: { gte: range.from, lte: range.to },
        student: {
          departmentId: departmentId ? departmentId : { not: null },
        },
      },
      select: {
        studentId: true,
        student: { select: { departmentId: true } },
        sessionNote: { select: { severity: true } },
      },
    }),
  ]);

  return departments.map((d) => {
    const rows = appointments.filter((a) => a.student.departmentId === d.id);
    const students = cohortSize(rows.map((r) => r.studentId));
    const severity: Record<SeverityLevel, number> = {
      MILD: 0,
      MODERATE: 0,
      CRITICAL: 0,
    };
    for (const r of rows) if (r.sessionNote) severity[r.sessionNote.severity] += 1;
    return {
      id: d.id,
      name: d.name,
      sessions: rows.length,
      students,
      reportable: cohortIsReportable(students),
      severity,
    };
  });
}

export type SeverityBucket = {
  label: string;
  MILD: number;
  MODERATE: number;
  CRITICAL: number;
};

export type SeverityTrend = {
  buckets: SeverityBucket[];
  totals: Record<SeverityLevel, number>;
  students: number;
  reportable: boolean;
};

const startOfUTCWeek = (d: Date) => {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  const dow = x.getUTCDay();
  x.setUTCDate(x.getUTCDate() - (dow === 0 ? 6 : dow - 1));
  return x;
};

const startOfUTCMonth = (d: Date) =>
  new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));

/** Campus-wide severity counts and trend, filterable by department. */
export async function severityAnalytics(
  range: Range,
  groupBy: "week" | "month",
  departmentId?: string,
): Promise<SeverityTrend> {
  const notes = await prisma.sessionNote.findMany({
    where: {
      createdAt: { gte: range.from, lte: range.to },
      ...(departmentId
        ? { appointment: { student: { departmentId } } }
        : {}),
    },
    // severity + who it belongs to. Never `content`.
    select: {
      severity: true,
      createdAt: true,
      appointment: { select: { studentId: true } },
    },
  });

  const bucketStart = groupBy === "month" ? startOfUTCMonth : startOfUTCWeek;
  const index = new Map<number, SeverityBucket>();
  const buckets: SeverityBucket[] = [];

  // Walk the window so empty periods still render as gaps, not as absent bars.
  const cursor = bucketStart(range.from);
  while (cursor <= range.to) {
    const bucket: SeverityBucket = {
      label: cursor.toLocaleDateString("en-IN", {
        ...(groupBy === "month"
          ? { month: "short", year: "2-digit" }
          : { day: "numeric", month: "short" }),
        timeZone: "UTC",
      }),
      MILD: 0,
      MODERATE: 0,
      CRITICAL: 0,
    };
    buckets.push(bucket);
    index.set(cursor.getTime(), bucket);
    if (groupBy === "month") cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    else cursor.setUTCDate(cursor.getUTCDate() + 7);
  }

  const totals: Record<SeverityLevel, number> = { MILD: 0, MODERATE: 0, CRITICAL: 0 };
  for (const n of notes) {
    totals[n.severity] += 1;
    const bucket = index.get(bucketStart(n.createdAt).getTime());
    if (bucket) bucket[n.severity] += 1;
  }

  const students = cohortSize(notes.map((n) => n.appointment.studentId));
  return { buckets, totals, students, reportable: cohortIsReportable(students) };
}

export type CounsellorLoad = {
  id: string;
  name: string;
  isActive: boolean;
  sessions: number;
  students: number;
  reportable: boolean;
  perPeriod: number;
};

/**
 * Sessions per counsellor over the window, plus an average per week/month.
 *
 * Deactivated counsellors stay in this list: their past load is history, and
 * switching an account off shouldn't quietly rewrite the workload record.
 */
export async function counsellorLoad(
  range: Range,
  groupBy: "week" | "month",
  departmentId?: string,
): Promise<CounsellorLoad[]> {
  const [counsellors, appointments] = await Promise.all([
    prisma.user.findMany({
      where: { role: "COUNSELLOR" },
      select: { id: true, name: true, isActive: true },
    }),
    prisma.appointment.findMany({
      where: {
        appointmentDate: { gte: range.from, lte: range.to },
        ...(departmentId ? { student: { departmentId } } : {}),
      },
      select: { counsellorId: true, studentId: true },
    }),
  ]);

  const days = Math.max(
    1,
    Math.round((range.to.getTime() - range.from.getTime()) / 86_400_000),
  );
  const periods = Math.max(1, groupBy === "month" ? days / 30 : days / 7);

  return counsellors
    .map((c) => {
      const mine = appointments.filter((a) => a.counsellorId === c.id);
      const students = cohortSize(mine.map((a) => a.studentId));
      return {
        id: c.id,
        name: c.name,
        isActive: c.isActive,
        sessions: mine.length,
        students,
        reportable: cohortIsReportable(students),
        perPeriod: Math.round((mine.length / periods) * 10) / 10,
      };
    })
    .sort((a, b) => b.sessions - a.sessions);
}
