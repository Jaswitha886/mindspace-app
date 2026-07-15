import type { AppointmentStatus } from "@prisma/client";
import { StatusChip } from "@/components/ui/status-chip";
import { CalendarIcon, UserIcon } from "@/components/icons";
import { formatDateLong, formatTimeRange } from "@/lib/format";

// The "Upcoming Counselling" card: a title with a status chip opposite it, then
// icon-led rows for who and when, then the actions.
export function AppointmentCard({
  title,
  person,
  personSub,
  date,
  startTime,
  endTime,
  status,
  actions,
  className = "",
}: {
  title: string;
  person: string;
  personSub?: string;
  date: Date | string;
  startTime: string;
  endTime: string;
  status?: AppointmentStatus;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-(--radius-card) border border-line bg-surface p-5 shadow-(--shadow-card) ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="t-h3">{title}</h3>
        {status && <StatusChip status={status} />}
      </div>

      <dl className="mt-3 flex flex-col gap-2">
        <div className="flex items-start gap-2.5">
          <dt className="mt-0.5 shrink-0 text-ink-muted">
            <UserIcon className="h-[1.05rem] w-[1.05rem]" />
            <span className="sr-only">Counsellor</span>
          </dt>
          <dd className="min-w-0">
            <span className="text-[0.9375rem] font-semibold text-ink">{person}</span>
            {personSub && (
              <span className="block text-[0.8125rem] text-ink-muted">{personSub}</span>
            )}
          </dd>
        </div>
        <div className="flex items-start gap-2.5">
          <dt className="mt-0.5 shrink-0 text-ink-muted">
            <CalendarIcon className="h-[1.05rem] w-[1.05rem]" />
            <span className="sr-only">When</span>
          </dt>
          <dd className="text-[0.9375rem] text-ink-secondary">
            {formatDateLong(date)} at {formatTimeRange(startTime, endTime)}
          </dd>
        </div>
      </dl>

      {actions && (
        <div className="mt-4 flex flex-wrap justify-end gap-2.5">{actions}</div>
      )}
    </div>
  );
}
