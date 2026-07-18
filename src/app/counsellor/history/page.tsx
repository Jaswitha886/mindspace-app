import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePageRole } from "@/lib/auth";
import { PageTitle } from "@/components/ui/page-title";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { StatusChip } from "@/components/ui/status-chip";
import { HistoryIcon } from "@/components/icons";
import { formatDateLong, formatTimeRange } from "@/lib/format";

// Past sessions, most recent first — the counsellor's record, and where they
// write or revise a note after the fact. It links into the existing note editor
// (/counsellor/notes/[id]); this page owns the *list*, not the note form.
//
// "Past" is two things: sessions marked COMPLETED, and APPROVED sessions whose
// day has gone (attended-but-not-closed, or a no-show). Both are done with as
// far as the schedule is concerned, and both may still want a note.
export default async function CounsellorHistoryPage() {
  const session = await requirePageRole("COUNSELLOR");

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const appointments = await prisma.appointment.findMany({
    where: {
      counsellorId: session.userId,
      OR: [
        { status: "COMPLETED" },
        { status: "APPROVED", appointmentDate: { lt: today } },
      ],
    },
    orderBy: [{ appointmentDate: "desc" }, { startTime: "desc" }],
    take: 100,
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

  return (
    <div className="flex flex-col gap-5">
      <PageTitle sub="Sessions you've held, most recent first. Add or revise a note here.">
        History
      </PageTitle>

      {appointments.length === 0 ? (
        <EmptyState
          icon={<HistoryIcon className="h-12 w-12" />}
          title="No past sessions yet"
          body="Once a session is over, it moves here so you can write up your notes."
        />
      ) : (
        <Card>
          <ul className="flex flex-col">
            {appointments.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-3 border-b border-line py-3.5 first:pt-0 last:border-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-[0.9375rem] font-semibold text-ink">
                    {a.student.name}
                  </p>
                  <p className="t-meta">
                    {formatDateLong(a.appointmentDate)} ·{" "}
                    {formatTimeRange(a.startTime, a.endTime)}
                  </p>
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
      )}
    </div>
  );
}
