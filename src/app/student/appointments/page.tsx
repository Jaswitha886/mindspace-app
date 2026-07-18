import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requirePageRole } from "@/lib/auth";
import { PageTitle } from "@/components/ui/page-title";
import { AppointmentCard } from "@/components/ui/appointment-card";
import { EmptyState } from "@/components/ui/states";
import { HistoryIcon, PlusIcon } from "@/components/icons";
import { CancelAppointmentButton } from "@/features/appointments/CancelAppointmentButton";

// Three views, not six status filters. A student thinks in "what's coming" and
// "what happened" — not in the schema's five statuses. Nothing is lost by
// collapsing them: every card's StatusChip still says exactly which status it
// is, so the filter only has to answer the coarse question.
type View = "all" | "upcoming" | "past";

const VIEWS: Array<{ label: string; value: View }> = [
  { label: "All", value: "all" },
  { label: "Upcoming", value: "upcoming" },
  { label: "Past", value: "past" },
];

const PAGE_SIZE = 10;

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; page?: string }>;
}) {
  const session = await requirePageRole("STUDENT");
  const params = await searchParams;
  const view: View =
    VIEWS.find((v) => v.value === params.view)?.value ?? "all";
  const page = Math.max(Number(params.page) || 1, 1);

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  // "Upcoming" is a live booking still ahead of you. Everything else is past:
  // finished, declined, cancelled — or a booking whose day has been and gone.
  const upcoming: Prisma.AppointmentWhereInput = {
    status: { in: ["PENDING", "APPROVED"] },
    appointmentDate: { gte: today },
  };
  const where: Prisma.AppointmentWhereInput = {
    studentId: session.userId,
    ...(view === "upcoming" ? upcoming : view === "past" ? { NOT: upcoming } : {}),
  };

  // Soonest-first when looking ahead, most-recent-first when looking back —
  // otherwise "Upcoming" leads with the session furthest away.
  const order: Prisma.SortOrder = view === "upcoming" ? "asc" : "desc";

  const [total, appointments] = await Promise.all([
    prisma.appointment.count({ where }),
    prisma.appointment.findMany({
      where,
      orderBy: [{ appointmentDate: order }, { startTime: order }],
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

  const filterHref = (value: View) =>
    value === "all"
      ? "/student/appointments"
      : `/student/appointments?view=${value}`;

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

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter appointments">
        {VIEWS.map((v) => {
          const active = v.value === view;
          return (
            <Link
              key={v.value}
              href={filterHref(v.value)}
              aria-current={active ? "true" : undefined}
              className={`rounded-(--radius-pill) px-4 py-1.5 text-sm font-semibold transition-colors duration-150 ${
                active
                  ? "bg-brand text-white"
                  : "bg-sunken text-ink-secondary hover:bg-line hover:text-ink"
              }`}
            >
              {v.label}
            </Link>
          );
        })}
      </div>

      {appointments.length === 0 ? (
        <EmptyState
          icon={<HistoryIcon className="h-12 w-12" />}
          title={
            view === "upcoming"
              ? "Nothing booked yet"
              : view === "past"
                ? "No past sessions"
                : "No appointments yet"
          }
          body={
            view === "all"
              ? "Whenever you're ready, booking one takes three small choices."
              : view === "upcoming"
                ? "When you book a session, it'll appear here until it's done."
                : "Sessions move here once they're finished, declined, or cancelled."
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
              href={`${filterHref(view)}${view === "all" ? "?" : "&"}page=${page - 1}`}
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
              href={`${filterHref(view)}${view === "all" ? "?" : "&"}page=${page + 1}`}
            >
              Older
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
