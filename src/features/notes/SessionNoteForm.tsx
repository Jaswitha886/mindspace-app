"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SeverityLevel } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { AlertIcon, CheckCircleIcon } from "@/components/icons";

const LEVELS: Array<{ value: SeverityLevel; label: string; cls: string }> = [
  { value: "MILD", label: "Mild", cls: "bg-mild" },
  { value: "MODERATE", label: "Moderate", cls: "bg-moderate" },
  { value: "CRITICAL", label: "Critical", cls: "bg-critical" },
];

// The reference "Session Notes" screen. The severity selector is not a label:
// choosing Critical notifies every admin and writes an audit entry, so the
// form says so before you save rather than after.
export function SessionNoteForm({
  appointmentId,
  studentName,
  existing,
}: {
  appointmentId: string;
  studentName: string;
  existing: { id: string; notes: string; severity: SeverityLevel } | null;
}) {
  const router = useRouter();
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [severity, setSeverity] = useState<SeverityLevel>(existing?.severity ?? "MILD");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Escalation fires on the transition into CRITICAL, matching the server.
  const willEscalate = severity === "CRITICAL" && existing?.severity !== "CRITICAL";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!notes.trim()) {
      setError("Write your observations before saving.");
      return;
    }
    if (willEscalate) {
      // Precise on purpose: the notification and the audit trail carry
      // different things, and the difference is the student's privacy.
      const okToGo = window.confirm(
        `Flagging this session CRITICAL notifies every admin immediately. They see your name and ${studentName}'s department — not their name. An audit entry naming you and ${studentName} is also recorded. Continue?`,
      );
      if (!okToGo) return;
    }

    setBusy(true);
    setError(null);
    setSaved(null);

    const res = await fetch(
      existing ? `/api/session-notes/${existing.id}` : "/api/session-notes",
      {
        method: existing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          existing ? { notes, severity } : { appointmentId, notes, severity },
        ),
      },
    );
    const body = await res.json().catch(() => null);
    setBusy(false);
    if (!res.ok || !body?.success) {
      setError(body?.message ?? "Couldn't save the note — try again.");
      return;
    }
    setSaved(body.message ?? "Note saved.");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div>
        <label htmlFor="notes" className="text-sm font-semibold text-ink">
          Observations
        </label>
        <textarea
          id="notes"
          rows={7}
          maxLength={5000}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Document your key observations during the session…"
          className="mt-1.5 w-full resize-y rounded-(--radius-input) border border-line bg-surface px-3.5 py-2.5 text-[0.9375rem] leading-relaxed text-ink placeholder:text-ink-muted focus:border-brand-light focus:outline-none"
        />
        <p className="t-meta mt-1.5">
          Visible to you and admins. The student never sees this note.
        </p>
      </div>

      <fieldset>
        <legend className="text-sm font-semibold text-ink">Severity Level</legend>
        <div className="mt-2.5 flex flex-wrap gap-2.5">
          {LEVELS.map((l) => {
            const active = severity === l.value;
            return (
              <button
                key={l.value}
                type="button"
                aria-pressed={active}
                onClick={() => setSeverity(l.value)}
                className={`rounded-(--radius-pill) px-4 py-1.5 text-sm font-semibold transition-all ${
                  active
                    ? `${l.cls} text-white ring-2 ring-ink-strong ring-offset-2`
                    : "bg-sunken text-ink-secondary hover:bg-line hover:text-ink"
                }`}
              >
                {l.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      {willEscalate && (
        <p className="flex items-start gap-2 rounded-(--radius-input) bg-red-tint px-3.5 py-2.5 text-sm font-semibold text-red-ink">
          <AlertIcon className="mt-0.5 h-[1.15rem] w-[1.15rem] shrink-0" />
          Saving as Critical notifies all admins immediately and records an audit
          entry. This is an escalation, not just a label.
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="rounded-(--radius-input) bg-red-tint px-3.5 py-2.5 text-sm font-semibold text-red-ink"
        >
          {error}
        </p>
      )}
      {saved && (
        <p
          role="status"
          className="flex items-center gap-2 rounded-(--radius-input) bg-success-tint px-3.5 py-2.5 text-sm font-semibold text-success-ink"
        >
          <CheckCircleIcon className="h-[1.15rem] w-[1.15rem]" />
          {saved}
        </p>
      )}

      <Button type="submit" size="lg" fullWidth disabled={busy}>
        {busy ? "Saving…" : existing ? "Update Notes" : "Finalize Notes"}
      </Button>
    </form>
  );
}
