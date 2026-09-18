import { BellIcon } from "@/components/icons";
import { Card } from "@/components/ui/card";
import { PageTitle } from "@/components/ui/page-title";
import { EmptyState } from "@/components/ui/states";
import { PwaControls } from "@/components/pwa/PwaControls";
import { NotificationAction } from "@/features/counsellor/NotificationActions";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type SuspensionPayload = {
  studentName: string;
  studentEmail: string;
  registerNumber?: string;
  reason: string;
  startDate: string;
  endDate: string;
  notes?: string;
};

function isSuspensionPayload(value: unknown): value is SuspensionPayload {
  if (!value || typeof value !== "object") return false;
  const payload = value as Record<string, unknown>;
  return ["studentName", "studentEmail", "reason", "startDate", "endDate"].every(
    (key) => typeof payload[key] === "string",
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default async function CounsellorNotificationsPage() {
  const session = await requirePageRole("COUNSELLOR");
  const notifications = await prisma.notification.findMany({
    where: { recipientId: session.userId, type: "SUSPENSION_ALERT" },
    orderBy: [{ isRead: "asc" }, { createdAt: "desc" }],
    take: 50,
  });
  const unread = notifications.filter((notification) => !notification.isRead).length;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageTitle sub="Updates that need your awareness.">Notifications</PageTitle>
        <div className="flex flex-wrap items-center gap-3 pb-1">
          <PwaControls />
          {unread > 0 && <NotificationAction label="Mark all as read" />}
        </div>
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          icon={<BellIcon className="h-12 w-12" />}
          title="No notifications"
          body="New counselling alerts will appear here."
        />
      ) : (
        <Card padding="none" className="divide-y divide-line overflow-hidden">
          {notifications.map((notification) => {
            if (!isSuspensionPayload(notification.payload)) return null;
            const payload = notification.payload;
            return (
              <article key={notification.id} className="p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-semibold text-ink">
                        {payload.studentName} has been suspended
                      </h2>
                      {!notification.isRead && (
                        <span className="h-2 w-2 rounded-full bg-red" aria-label="Unread" />
                      )}
                    </div>
                    <p className="mt-1 text-sm text-ink-secondary">
                      {payload.registerNumber ? `${payload.registerNumber} | ` : ""}
                      {payload.studentEmail}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <time className="text-xs text-ink-muted" dateTime={notification.createdAt.toISOString()}>
                      {notification.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </time>
                    {!notification.isRead && <NotificationAction notificationId={notification.id} />}
                  </div>
                </div>
                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Period</dt>
                    <dd className="mt-1 text-ink">{formatDate(payload.startDate)} to {formatDate(payload.endDate)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Reason</dt>
                    <dd className="mt-1 text-ink">{payload.reason}</dd>
                  </div>
                  {payload.notes && (
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Notes</dt>
                      <dd className="mt-1 text-ink">{payload.notes}</dd>
                    </div>
                  )}
                </dl>
              </article>
            );
          })}
        </Card>
      )}
    </div>
  );
}
