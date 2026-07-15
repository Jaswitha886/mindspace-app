"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Mood } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { MoodCircles } from "@/features/moods/MoodCircles";
import { CheckCircleIcon } from "@/components/icons";

// The reference's "Log Mood" screen: the circle row under the question, an
// "Optional Notes" well, then a full-width submit.
export function MoodEntryForm({ todaysMood }: { todaysMood: Mood | null }) {
  const router = useRouter();
  const [mood, setMood] = useState<Mood | null>(todaysMood);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!mood) {
      setError("Pick how you're feeling first — no wrong answers.");
      return;
    }
    setBusy(true);
    setError(null);
    setSaved(false);
    const res = await fetch("/api/student/moods", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mood, note: note.trim() || undefined }),
    });
    const body = await res.json().catch(() => null);
    setBusy(false);
    if (!res.ok || !body?.success) {
      setError(body?.message ?? "Couldn't save — try again.");
      return;
    }
    setSaved(true);
    setNote("");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <fieldset>
        <legend className="t-h2 mb-4">How are you feeling today?</legend>
        <MoodCircles value={mood} onSelect={setMood} disabled={busy} />
        {todaysMood && (
          <p className="t-meta mt-3">
            Choosing again simply replaces today&apos;s entry.
          </p>
        )}
      </fieldset>

      <div className="rounded-(--radius-card) bg-sunken-2 p-4">
        <label htmlFor="mood-note" className="text-[0.9375rem] font-semibold text-ink">
          Optional Notes
        </label>
        <textarea
          id="mood-note"
          rows={4}
          maxLength={500}
          placeholder="What's on your mind? (e.g., 'Feeling stressed about exams.')"
          className="mt-2 w-full resize-y rounded-(--radius-input) border border-line bg-surface px-3.5 py-2.5 text-[0.9375rem] leading-relaxed text-ink placeholder:text-ink-muted focus:border-brand-light focus:outline-none"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

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
          Mood successfully logged!
        </p>
      )}

      <Button type="submit" size="lg" fullWidth disabled={busy}>
        {busy ? "Saving…" : "Submit Mood Log"}
      </Button>
    </form>
  );
}
