"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TextareaField } from "@/components/ui/field";

export function QuoteOfDayForm() {
  const [message, setMessage] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setError(undefined);
    setBusy(true);

    try {
      const response = await fetch("/api/counsellor/affirmations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.success) {
        setError(body?.message ?? "Could not share the quote.");
        return;
      }
      setMessage("");
      setFeedback("Quote shared with your students.");
    } catch {
      setError("Could not share the quote. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
      <TextareaField
        label="Quote"
        id="quote-of-day"
        placeholder="Write a thoughtful quote for your students"
        rows={3}
        maxLength={500}
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        error={error}
        hint="This will appear on the dashboards of students you have counselled."
      />
      {feedback && (
        <p role="status" className="text-sm font-semibold text-success-ink">
          {feedback}
        </p>
      )}
      <Button type="submit" size="sm" disabled={busy || !message.trim()}>
        {busy ? "Sharing..." : "Share quote"}
      </Button>
    </form>
  );
}
