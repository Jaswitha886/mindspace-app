import { prisma } from "@/lib/prisma";
import { requirePageRole } from "@/lib/auth";
import { PageTitle } from "@/components/ui/page-title";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { CalendarIcon } from "@/components/icons";
import { RequestActions } from "@/features/counsellor/RequestActions";
import { formatDateLong, formatTimeRange } from "@/lib/format";

export default async function CounsellorRequestsPage() {
  const session = await requirePageRole("COUNSELLOR");
  const requests = await prisma.appointment.findMany({
    where: { counsellorId: session.userId, status: "PENDING" },
    orderBy: [{ appointmentDate: "asc" }, { startTime: "asc" }],
    select: {
      id: true,
      appointmentDate: true,
      startTime: true,
      endTime: true,
      reason: true,
      student: { select: { name: true } },
    },
  });

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <PageTitle sub="Review each request before it becomes a confirmed session.">
        Appointment Requests
      </PageTitle>
      {requests.length === 0 ? (
        <EmptyState
          icon={<CalendarIcon className="h-12 w-12" />}
          title="All caught up"
          body="New student requests will appear here."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {requests.map((request) => (
            <Card key={request.id}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-base font-bold text-ink">{request.student.name}</p>
                  <p className="t-meta mt-1">
                    {formatDateLong(request.appointmentDate)} · {formatTimeRange(request.startTime, request.endTime)}
                  </p>
                  {request.reason && <p className="mt-3 max-w-prose text-sm leading-relaxed text-ink-secondary">“{request.reason}”</p>}
                </div>
                <RequestActions appointmentId={request.id} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
