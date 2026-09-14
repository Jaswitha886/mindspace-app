import { prisma } from "@/lib/prisma";
import { requirePageRole } from "@/lib/auth";
import { PageTitle } from "@/components/ui/page-title";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { UsersIcon } from "@/components/icons";
import { WalkInSearch } from "@/features/checkin/WalkInSearch";
import { formatTimeRange } from "@/lib/format";

export default async function CounsellorWalkInsPage() {
  const session = await requirePageRole("COUNSELLOR");

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

  const walkIns = await prisma.appointment.findMany({
    where: {
      counsellorId: session.userId,
      reason: { contains: "Walk-in" },
      appointmentDate: { gte: today, lt: tomorrow },
    },
    orderBy: { startTime: "desc" },
    select: {
      id: true,
      startTime: true,
      endTime: true,
      status: true,
      student: { select: { name: true } },
    },
  });

  return (
    <div className="flex flex-col gap-5">
      <PageTitle sub="Start a walk-in session for a student who doesn't have a booking.">
        Walk-ins
      </PageTitle>

      <Card tone="plum">
        <p className="t-h3">Start a Walk-in</p>
        <p className="t-meta mt-1">
          Find the student and begin a session immediately.
        </p>
        <div className="mt-3">
          <WalkInSearch />
        </div>
      </Card>

      {walkIns.length === 0 ? (
        <EmptyState
          icon={<UsersIcon className="h-12 w-12" />}
          title="No walk-ins today"
          body="Walk-in sessions will appear here once started."
        />
      ) : (
        <Card>
          <h2 className="t-h3">Today&apos;s Walk-ins</h2>
          <ul className="mt-3 flex flex-col">
            {walkIns.map((w) => (
              <li
                key={w.id}
                className="flex items-center justify-between gap-3 border-b border-line py-3 last:border-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">
                    {w.student.name}
                  </p>
                  <p className="text-xs text-ink-muted">
                    {formatTimeRange(w.startTime, w.endTime)}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-(--radius-pill) px-2.5 py-1 text-xs font-semibold ${
                    w.status === "COMPLETED"
                      ? "bg-sunken text-ink-secondary"
                      : "bg-success-tint text-success-ink"
                  }`}
                >
                  {w.status === "COMPLETED" ? "Completed" : "Active"}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
