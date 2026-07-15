import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePageRole } from "@/lib/auth";
import { PageTitle } from "@/components/ui/page-title";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { StatusChip } from "@/components/ui/status-chip";
import { CalendarIcon } from "@/components/icons";
import { formatDateLong, formatTimeRange } from "@/lib/format";

// Confirmed appointments, upcoming first — where a request lands once approved.
export default async function CounsellorSchedulePage() {
  const session = await requirePageRole("COUNSELLOR");

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const appointments = await prisma.appointment.findMany({
    where: {
      counsellorId: session.userId,
      status: { in: ["APPROVED", "COMPLETED"] },
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
      student: { select: { name: true } },
      sessionNote: { select: { id: true, severity: true } },
    },
  });

  // Group by day so the list reads as a schedule, not a flat feed.
  const byDay = new Map<string, typeof appointments>();
  for (const a of appointments) {
    const key = a.appointmentDate.toISOString().slice(0, 10);
    byDay.set(key, [...(byDay.get(key) ?? []), a]);
  }

  return (
    <div className="flex flex-col gap-5">
      <PageTitle sub="Your confirmed sessions, soonest first.">Schedule</PageTitle>

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
                      </p>
                      {a.reason && (
                        <p className="mt-1 max-w-prose text-sm text-ink-secondary">
                          “{a.reason}”
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <StatusChip status={a.status} />
                      <Link
                        href={`/counsellor/notes/${a.id}`}
                        className="text-sm font-semibold text-brand-ink hover:underline"
                      >
                        {a.sessionNote ? "Edit note" : "Add note"}
                      </Link>
                    </div>
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
