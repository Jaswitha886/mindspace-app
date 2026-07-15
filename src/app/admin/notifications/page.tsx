import { prisma } from "@/lib/prisma";
import { requirePageRole } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { PageTitle } from "@/components/ui/page-title";
import { EscalationInbox } from "@/features/admin/EscalationInbox";
import { toInboxItems } from "@/features/admin/escalation-view";

// The inbox that makes escalation real. Without it, flagging a note CRITICAL
// would write a Notification row nobody ever reads — which is exactly the
// "silent data point" the escalation rule exists to prevent.
export default async function AdminNotificationsPage() {
  const session = await requirePageRole("ADMIN");

  const notifications = await prisma.notification.findMany({
    where: { recipientId: session.userId, type: "CRITICAL_SEVERITY" },
    orderBy: [{ isRead: "asc" }, { createdAt: "desc" }],
    take: 100,
  });

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <PageTitle sub="Every critical severity flag raised by a counsellor, newest and unread first.">
        Notifications
      </PageTitle>

      <Card>
        <EscalationInbox items={await toInboxItems(notifications)} />
      </Card>

      <p className="t-meta px-1">
        These alerts name the counsellor and the student&apos;s department, never
        the student. They never carry the note&apos;s contents either — those stay
        between the counsellor and their record.
      </p>
    </div>
  );
}
