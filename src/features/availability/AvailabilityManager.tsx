"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircleIcon } from "@/components/icons";

export type Slot = {
  id: string;
  isRecurring: boolean;
  dayOfWeek: number | null;
  specificDate: string | null;
  startTime: string;
  endTime: string;
  isActive: boolean;
};

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Working hours 09:00–17:00 (schema); one-hour windows, which is what the
// booking slot grid renders.
const HOURS = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];
const nextHour = (h: string) => `${String(Number(h.slice(0, 2)) + 1).padStart(2, "0")}:00`;

const label = (s: Slot) =>
  s.isRecurring ? `Every ${DAYS[s.dayOfWeek ?? 0]}` : (s.specificDate ?? "");

export function AvailabilityManager({ initial }: { initial: Slot[] }) {
  const router = useRouter();
  const [mode, setMode] = useState<"recurring" | "oneoff">("recurring");
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [specificDate, setSpecificDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function call(url: string, init: RequestInit) {
    setBusy(true);
    setError(null);
    setNotice(null);
    const res = await fetch(url, init);
    const body = await res.json().catch(() => null);
    setBusy(false);
    if (!res.ok || !body?.success) {
      setError(body?.message ?? "Something went wrong — try again.");
      return false;
    }
    setNotice(body.message ?? "Saved.");
    router.refresh();
    return true;
  }

  const add = () =>
    call("/api/counsellor/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        isRecurring: mode === "recurring",
        dayOfWeek: mode === "recurring" ? dayOfWeek : null,
        specificDate: mode === "oneoff" ? specificDate : null,
        startTime,
        endTime: nextHour(startTime),
      }),
    });

  const toggle = (s: Slot) =>
    call(`/api/counsellor/availability/${s.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !s.isActive }),
    });

  const remove = (s: Slot) => {
    if (!window.confirm("Remove this slot?")) return;
    void call(`/api/counsellor/availability/${s.id}`, { method: "DELETE" });
  };

  const recurring = initial.filter((s) => s.isRecurring);
  const oneOff = initial.filter((s) => !s.isRecurring);

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <h2 className="t-h2">Add a Slot</h2>
        <p className="t-body mt-1">
          Students can only book inside these windows. Hours run 09:00–17:00.
        </p>

        <div className="mt-4 flex gap-2.5" role="group" aria-label="Slot type">
          {(
            [
              ["recurring", "Every week"],
              ["oneoff", "One-off date"],
            ] as const
          ).map(([value, text]) => (
            <button
              key={value}
              type="button"
              aria-pressed={mode === value}
              onClick={() => setMode(value)}
              className={`rounded-(--radius-pill) px-4 py-1.5 text-sm font-semibold transition-colors ${
                mode === value
                  ? "bg-brand text-white"
                  : "bg-sunken text-ink-secondary hover:bg-line hover:text-ink"
              }`}
            >
              {text}
            </button>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {mode === "recurring" ? (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="dow" className="text-sm font-semibold text-ink">
                Day
              </label>
              <select
                id="dow"
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(Number(e.target.value))}
                className="w-full rounded-(--radius-input) border border-line bg-surface px-3.5 py-2.5 text-[0.9375rem] text-ink focus:border-brand-light focus:outline-none"
              >
                {DAYS.map((d, i) => (
                  <option key={d} value={i}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="date" className="text-sm font-semibold text-ink">
                Date
              </label>
              <input
                id="date"
                type="date"
                value={specificDate}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setSpecificDate(e.target.value)}
                className="w-full rounded-(--radius-input) border border-line bg-surface px-3.5 py-2.5 text-[0.9375rem] text-ink focus:border-brand-light focus:outline-none"
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="start" className="text-sm font-semibold text-ink">
              Time
            </label>
            <select
              id="start"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full rounded-(--radius-input) border border-line bg-surface px-3.5 py-2.5 text-[0.9375rem] text-ink focus:border-brand-light focus:outline-none"
            >
              {HOURS.map((h) => (
                <option key={h} value={h}>
                  {h} – {nextHour(h)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-(--radius-input) bg-red-tint px-3.5 py-2.5 text-sm font-semibold text-red-ink"
          >
            {error}
          </p>
        )}
        {notice && (
          <p
            role="status"
            className="mt-4 flex items-center gap-2 rounded-(--radius-input) bg-success-tint px-3.5 py-2.5 text-sm font-semibold text-success-ink"
          >
            <CheckCircleIcon className="h-[1.15rem] w-[1.15rem]" />
            {notice}
          </p>
        )}

        <Button
          className="mt-4"
          disabled={busy || (mode === "oneoff" && !specificDate)}
          onClick={add}
        >
          {busy ? "Saving…" : "Add slot"}
        </Button>
      </Card>

      {(
        [
          ["Recurring Availability", recurring],
          ["One-off Dates", oneOff],
        ] as const
      ).map(([title, rows]) => (
        <Card key={title}>
          <h2 className="t-h2">{title}</h2>
          {rows.length === 0 ? (
            <p className="t-body mt-2">Nothing here yet.</p>
          ) : (
            <ul className="mt-3 flex flex-col">
              {rows.map((s) => (
                <li
                  key={s.id}
                  className="flex flex-wrap items-center justify-between gap-3 border-b border-line py-3 first:pt-0 last:border-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="text-[0.9375rem] font-semibold text-ink">{label(s)}</p>
                    <p className="t-meta">
                      {s.startTime} – {s.endTime}
                      {!s.isActive && " · disabled"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <button
                      onClick={() => toggle(s)}
                      disabled={busy}
                      aria-pressed={s.isActive}
                      className="text-sm font-semibold text-brand-ink hover:underline disabled:text-ink-muted"
                    >
                      {s.isActive ? "Disable" : "Enable"}
                    </button>
                    <button
                      onClick={() => remove(s)}
                      disabled={busy}
                      className="text-sm font-semibold text-red-ink hover:underline disabled:text-ink-muted"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      ))}
    </div>
  );
}
