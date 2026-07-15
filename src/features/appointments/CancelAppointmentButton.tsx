"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function CancelAppointmentButton({ appointmentId }: { appointmentId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onCancel() {
    if (!window.confirm("Cancel this appointment request?")) return;
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/appointments/${appointmentId}/cancel`, {
      method: "PATCH",
    });
    const body = await res.json().catch(() => null);
    if (!res.ok || !body?.success) {
      setError(body?.message ?? "Couldn't cancel — try again.");
      setBusy(false);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="destructive" size="sm" onClick={onCancel} disabled={busy}>
        {busy ? "Cancelling…" : "Cancel"}
      </Button>
      {error && (
        <p role="alert" className="text-xs font-semibold text-red-ink">
          {error}
        </p>
      )}
    </div>
  );
}
