import { prisma } from "@/lib/prisma";
import { requirePageRole } from "@/lib/auth";
import { PageTitle } from "@/components/ui/page-title";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { JournalIcon } from "@/components/icons";
import { formatDateLong, formatTimeRange } from "@/lib/format";

export default async function CounsellorResourcesPage() {
  const session = await requirePageRole("COUNSELLOR");

  const notes = await prisma.sessionNote.findMany({
    where: { counsellorId: session.userId },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      content: true,
      severity: true,
      createdAt: true,
      appointment: {
        select: {
          appointmentDate: true,
          startTime: true,
          endTime: true,
          student: { select: { name: true } },
        },
      },
    },
  });

  return (
    <div className="flex flex-col gap-5">
      <PageTitle sub="Session notes you've written, most recent first.">
        Resources
      </PageTitle>

      {notes.length === 0 ? (
        <EmptyState
          icon={<JournalIcon className="h-12 w-12" />}
          title="No session notes yet"
          body="Notes you write after sessions will appear here."
        />
      ) : (
        <Card>
          <ul className="flex flex-col">
            {notes.map((note) => (
              <li
                key={note.id}
                className="border-b border-line py-4 first:pt-0 last:border-0 last:pb-0"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[0.9375rem] font-semibold text-ink">
                      {note.appointment.student.name}
                    </p>
                    <p className="t-meta">
                      {formatDateLong(note.appointment.appointmentDate)} \u00b7{" "}
                      {formatTimeRange(
                        note.appointment.startTime,
                        note.appointment.endTime,
                      )}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-(--radius-pill) px-2.5 py-1 text-xs font-semibold ${
                      note.severity === "CRITICAL"
                        ? "bg-critical text-white"
                        : note.severity === "MODERATE"
                          ? "bg-moderate text-white"
                          : "bg-mild text-white"
                    }`}
                  >
                    {note.severity}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
                  {note.content}
                </p>
                <p className="mt-1.5 text-xs text-ink-muted">
                  Written{" "}
                  {new Date(note.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    timeZone: "UTC",
                  })}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
