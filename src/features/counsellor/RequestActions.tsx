"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

// Confirm / decline a pending request. Declining opens a small reason box —
// optional, but it's what the student sees, so it's worth offering.
export function RequestActions({ appointmentId }: { appointmentId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"approve" | "reject" | null>(null);
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function send(action: "approve" | "reject") {
    setBusy(action);
    setError(null);
    const res = await fetch(`/api/appointments/${appointmentId}/${action}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(action === "reject" ? { reason: reason.trim() || undefined } : {}),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok || !body?.success) {
      setError(body?.message ?? "Couldn't update this request — try again.");
      setBusy(null);
      return;
    }
    setDeclining(false);
    router.refresh();
  }

  if (declining) {
    return (
      <div className="mt-3 flex flex-col gap-2.5">
        <label htmlFor={`reason-${appointmentId}`} className="text-sm font-semibold text-ink">
          Reason or a time that suits better (optional)
        </label>
        <textarea
          id={`reason-${appointmentId}`}
          rows={2}
          maxLength={500}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. I'm away that week — would Thursday 2pm work?"
          className="w-full resize-y rounded-(--radius-input) border border-line bg-surface px-3.5 py-2.5 text-sm leading-relaxed text-ink placeholder:text-ink-muted focus:border-brand-light focus:outline-none"
        />
        {error && (
          <p role="alert" className="text-xs font-semibold text-red-ink">
            {error}
          </p>
        )}
        <div className="flex gap-2.5">
          <Button
            variant="destructive"
            size="sm"
            disabled={busy !== null}
            onClick={() => send("reject")}
          >
            {busy === "reject" ? "Declining…" : "Confirm decline"}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={busy !== null}
            onClick={() => {
              setDeclining(false);
              setError(null);
            }}
          >
            Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 flex flex-col items-end gap-1">
      <div className="flex gap-2.5">
        <Button
          variant="outline"
          size="sm"
          disabled={busy !== null}
          onClick={() => setDeclining(true)}
        >
          Decline
        </Button>
        <Button size="sm" disabled={busy !== null} onClick={() => send("approve")}>
          {busy === "approve" ? "Confirming…" : "Confirm"}
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-xs font-semibold text-red-ink">
          {error}
        </p>
      )}
    </div>
  );
}
