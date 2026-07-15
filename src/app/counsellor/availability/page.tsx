import { prisma } from "@/lib/prisma";
import { requirePageRole } from "@/lib/auth";
import { PageTitle } from "@/components/ui/page-title";
import { AvailabilityManager } from "@/features/availability/AvailabilityManager";

export default async function AvailabilityPage() {
  const session = await requirePageRole("COUNSELLOR");

  const rows = await prisma.availability.findMany({
    where: { counsellorId: session.userId },
    orderBy: [{ isRecurring: "desc" }, { dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <PageTitle sub="Set the windows students may book. Booking depends on these — with none set, nobody can request a session.">
        Manage Availability
      </PageTitle>
      <AvailabilityManager
        initial={rows.map((r) => ({
          id: r.id,
          isRecurring: r.isRecurring,
          dayOfWeek: r.dayOfWeek,
          specificDate: r.specificDate
            ? r.specificDate.toISOString().slice(0, 10)
            : null,
          startTime: r.startTime,
          endTime: r.endTime,
          isActive: r.isActive,
        }))}
      />
    </div>
  );
}
