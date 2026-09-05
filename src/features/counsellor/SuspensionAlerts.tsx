"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertIcon } from "@/components/icons";
import { formatDate } from "@/lib/format";

export type SuspensionAlertItem = {
  id: string;
  isRead: boolean;
  createdAt: string;
  studentName: string;
  studentEmail: string;
  registerNumber: string | null;
  reason: string;
  startDate: string;
  endDate: string;
  notes: string | null;
};

export function SuspensionAlerts({ items }: { items: SuspensionAlertItem[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function markRead(id: string) {
    setBusy(true);
    await fetch("/api/counsellor/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <Card tone={items.some((item) => !item.isRead) ? "gold" : "sunken"}>
      <div className="flex items-center gap-2">
        <AlertIcon className="h-5 w-5 text-red-ink" />
        <h2 className="t-h2">Suspension Alerts</h2>
      </div>
      {items.length === 0 ? (
        <p className="t-body mt-2">No suspension alerts.</p>
      ) : (
        <ul className="mt-3 flex flex-col">
          {items.map((item) => (
            <li key={item.id} className={`border-b border-line py-4 last:border-0 ${item.isRead ? "" : "rounded-(--radius-input) bg-surface/70 px-2"}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink">Suspension Alert: {item.studentName} has been suspended.</p>
                  <p className="t-meta mt-1">{item.registerNumber ?? item.studentEmail} · {formatDate(item.startDate)} – {formatDate(item.endDate)}</p>
                </div>
                {!item.isRead && <Button variant="link" size="sm" disabled={busy} onClick={() => markRead(item.id)}>Mark read</Button>}
              </div>
              <p className="mt-2 text-sm text-ink-secondary"><span className="font-semibold">Reason:</span> {item.reason}</p>
              {item.notes && <p className="mt-1 text-sm text-ink-secondary"><span className="font-semibold">Notes:</span> {item.notes}</p>}
              <p className="t-meta mt-2">{item.studentEmail}</p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
