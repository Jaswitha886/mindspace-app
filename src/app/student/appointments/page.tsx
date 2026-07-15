import Link from "next/link";
import type { AppointmentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requirePageRole } from "@/lib/auth";
import { PageTitle } from "@/components/ui/page-title";
import { AppointmentCard } from "@/components/ui/appointment-card";
import { EmptyState } from "@/components/ui/states";
import { HistoryIcon, PlusIcon } from "@/components/icons";
import { CancelAppointmentButton } from "@/features/appointments/CancelAppointmentButton";

const FILTERS: Array<{ label: string; value?: AppointmentStatus }> = [
  { label: "All" },
  { label: "Pending", value: "PENDING" },
  { label: "Confirmed", value: "APPROVED" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Declined", value: "REJECTED" },
  { label: "Cancelled", value: "CANCELLED" },
];

const PAGE_SIZE = 10;

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const session = await requirePageRole("STUDENT");
  const params = await searchParams;
  const status = FILTERS.find((f) => f.value === params.status)?.value;
  const page = Math.max(Number(params.page) || 1, 1);

  const where = { studentId: session.userId, ...(status ? { status } : {}) };
  const [total, appointments] = await Promise.all([
    prisma.appointment.count({ where }),
    prisma.appointment.findMany({
      where,
      orderBy: [{ appointmentDate: "desc" }, { startTime: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        counsellor: {
          select: {
            name: true,
            counsellorProfile: { select: { specialization: true } },
          },
        },
      },
    }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const filterHref = (value?: AppointmentStatus) =>
    value ? `/student/appointments?status=${value}` : "/student/appointments";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageTitle sub="Your booked and past sessions.">My Appointments</PageTitle>
        <Link
          href="/student/appointments/new"
          className="inline-flex items-center gap-2 rounded-(--radius-btn) bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-(--shadow-btn) transition-colors hover:bg-brand-hover"
        >
          <PlusIcon className="h-[1.05rem] w-[1.05rem]" />
          Book Session
        </Link>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
        {FILTERS.map((f) => {
          const active = f.value === status;
          return (
            <Link
              key={f.label}
              href={filterHref(f.value)}
              aria-current={active ? "true" : undefined}
              className={`rounded-(--radius-pill) px-4 py-1.5 text-sm font-semibold transition-colors duration-150 ${
                active
                  ? "bg-brand text-white"
                  : "bg-sunken text-ink-secondary hover:bg-line hover:text-ink"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      {appointments.length === 0 ? (
        <EmptyState
          icon={<HistoryIcon className="h-12 w-12" />}
          title={status ? "Nothing with this status" : "No appointments yet"}
          body={
            status
              ? "Try another filter to see your other sessions."
              : "Whenever you're ready, booking one takes three small choices."
          }
        />
      ) : (
        <ul className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {appointments.map((a) => (
            <li key={a.id}>
              <AppointmentCard
                title="Counselling Session"
                person={a.counsellor.name}
                personSub={a.counsellor.counsellorProfile?.specialization ?? undefined}
                date={a.appointmentDate}
                startTime={a.startTime}
                endTime={a.endTime}
                status={a.status}
                actions={
                  a.status === "PENDING" ? (
                    <CancelAppointmentButton appointmentId={a.id} />
                  ) : undefined
                }
              />
              {a.reason && (
                <p className="t-meta mt-2 px-1">
                  {a.status === "REJECTED" ? "Counsellor's note: " : ""}
                  {a.reason}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <nav aria-label="Pagination" className="flex items-center gap-3 text-sm">
          {page > 1 && (
            <Link
              className="font-semibold text-brand-ink hover:underline"
              href={`${filterHref(status)}${status ? "&" : "?"}page=${page - 1}`}
            >
              Newer
            </Link>
          )}
          <span className="t-meta">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link
              className="font-semibold text-brand-ink hover:underline"
              href={`${filterHref(status)}${status ? "&" : "?"}page=${page + 1}`}
            >
              Older
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
