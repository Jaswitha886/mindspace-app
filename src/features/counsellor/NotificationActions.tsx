"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon } from "@/components/icons";

export function NotificationAction({
  notificationId,
  label = "Mark as read",
}: {
  notificationId?: string;
  label?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function markRead() {
    setPending(true);
    try {
      const response = await fetch("/api/counsellor/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(notificationId ? { id: notificationId } : {}),
      });
      if (response.ok) router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={markRead}
      disabled={pending}
      className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-ink hover:underline disabled:text-ink-muted disabled:no-underline"
    >
      <CheckIcon className="h-3.5 w-3.5" />
      {pending ? "Saving..." : label}
    </button>
  );
}
