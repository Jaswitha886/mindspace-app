"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AlertIcon, CheckCircleIcon } from "@/components/icons";

export type InboxItem = {
  id: string;
  isRead: boolean;
  createdAt: string;
  counsellorName: string;
  /** The student's department, never their name — see escalation-view.ts. */
  studentDepartment: string;
};

// Critical escalations, surfaced. The Notification row is written by
// escalateCritical(); this is where an admin actually reads it.
// Note content is never fetched or shown here — only that a flag was raised,
// and never by whom: the student is identified only by department.
export function EscalationInbox({
  items,
  total,
  unread,
}: {
  items: InboxItem[];
  /** Totals across ALL escalations, not just the `items` shown. The dashboard
   *  passes a truncated preview, so counting `items` there would under-report
   *  and tell an admin they were caught up when they weren't. */
  total?: number;
  unread?: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const shownUnread = unread ?? items.filter((i) => !i.isRead).length;
  const shownTotal = total ?? items.length;

  async function markRead(id?: string) {
    setBusy(true);
    await fetch("/api/admin/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(id ? { id } : {}),
    });
    setBusy(false);
    router.refresh();
  }

  if (items.length === 0) {
    return (
      <p className="t-body flex items-center gap-2">
        <CheckCircleIcon className="h-[1.15rem] w-[1.15rem] text-success" />
        No critical escalations. You&apos;ll be notified here the moment a
        counsellor flags one.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <p className="t-meta">
          {shownUnread > 0 ? `${shownUnread} unread` : "All read"} · {shownTotal} total
          {shownTotal > items.length && ` · showing ${items.length}`}
        </p>
        {shownUnread > 0 && (
          <Button variant="secondary" size="sm" disabled={busy} onClick={() => markRead()}>
            Mark all read
          </Button>
        )}
      </div>

      <ul className="flex flex-col">
        {items.map((n) => (
          <li
            key={n.id}
            className={`flex flex-wrap items-start justify-between gap-3 rounded-(--radius-input) border-b border-line px-2 py-3 last:border-0 ${
              n.isRead ? "" : "bg-red-tint/60"
            }`}
          >
            <div className="flex min-w-0 items-start gap-2.5">
              <span
                className={`mt-0.5 shrink-0 ${n.isRead ? "text-ink-muted" : "text-red-ink"}`}
              >
                <AlertIcon className="h-[1.15rem] w-[1.15rem]" />
              </span>
              <div className="min-w-0">
                <p className="text-[0.9375rem] text-ink">
                  <span className="font-semibold">{n.counsellorName}</span> flagged a
                  session with a student from{" "}
                  <span className="font-semibold">{n.studentDepartment}</span> as
                  critical.
                </p>
                <p className="t-meta mt-0.5">
                  {new Date(n.createdAt).toLocaleString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
            {!n.isRead && (
              <button
                onClick={() => markRead(n.id)}
                disabled={busy}
                className="shrink-0 text-sm font-semibold text-brand-ink hover:underline disabled:text-ink-muted"
              >
                Mark read
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
