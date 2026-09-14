"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SendIcon } from "@/components/icons";

export function QuoteOfDayForm() {
  const [message, setMessage] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const maxLen = 200;

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
      <div className="relative">
        <textarea
          id="quote-of-day"
          placeholder="Write a thoughtful quote for your students..."
          rows={3}
          maxLength={maxLen}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className="w-full rounded-(--radius-input) border border-line bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-brand-light focus:outline-none focus:ring-2 focus:ring-brand/20"
        />
        <span className="absolute bottom-2 right-3 text-xs text-ink-muted">
          {message.length}/{maxLen}
        </span>
      </div>
      {error && (
        <p role="alert" className="text-sm font-semibold text-red-ink">
          {error}
        </p>
      )}
      {feedback && (
        <p role="status" className="text-sm font-semibold text-success-ink">
          {feedback}
        </p>
      )}
      <div className="flex justify-end">
        <Button
          type="submit"
          size="sm"
          disabled={busy || !message.trim()}
          className="inline-flex items-center gap-2"
        >
          <SendIcon className="h-4 w-4" />
          {busy ? "Sharing..." : "Share Quote"}
        </Button>
      </div>
    </form>
  );
}
