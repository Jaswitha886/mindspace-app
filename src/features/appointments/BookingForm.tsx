"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/features/appointments/Calendar";
import { AvailabilityChip } from "@/components/ui/status-chip";
import { UserIcon } from "@/components/icons";
import { formatTimeRange } from "@/lib/format";

export type CounsellorOption = {
  id: string; // User id — appointments reference User.id
  name: string;
  specialization: string | null;
  yearsOfExperience: number | null;
};

type Slot = { startTime: string; endTime: string; booked: boolean; past: boolean };

const hhmm = (iso: string) => iso.slice(11, 16); // slots are UTC-encoded "HH:mm"

const prettyDate = (ymdStr: string) => {
  if (!ymdStr) return "";
  const [y, m, d] = ymdStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
};

// The reference's booking flow: choose a counsellor, pick a date from the
// calendar, then a slot from the grid, then confirm.
export function BookingForm({ counsellors }: { counsellors: CounsellorOption[] }) {
  const router = useRouter();
  const [counsellorId, setCounsellorId] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selected, setSelected] = useState<Slot | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadSlots = useCallback(async () => {
    if (!counsellorId || !date) return;
    setSlotsLoading(true);
    setSelected(null);
    setError(null);
    const res = await fetch(`/api/counsellors/${counsellorId}/slots?date=${date}`);
    const body = await res.json().catch(() => null);
    setSlots(body?.success ? body.data.slots : []);
    if (!res.ok) setError(body?.message ?? "Couldn't load slots.");
    setSlotsLoading(false);
  }, [counsellorId, date]);

  useEffect(() => {
    void loadSlots();
  }, [loadSlots]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!counsellorId || !date || !selected) return;
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        counsellorId,
        date,
        startTime: hhmm(selected.startTime),
        endTime: hhmm(selected.endTime),
        reason: reason.trim() || undefined,
      }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok || !body?.success) {
      setError(body?.message ?? "Couldn't book this slot. Pick another time.");
      setSubmitting(false);
      if (res.status === 409) void loadSlots(); // slot was just taken — refresh
      return;
    }
    router.push("/student/appointments");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      {/* Counsellor list rows. */}
      <section>
        <h2 className="t-h2">Choose a Counsellor</h2>
        <p className="t-body mt-1">Pick who you&apos;d like to talk to.</p>
        <div role="radiogroup" className="mt-3 flex flex-col gap-2.5">
          {counsellors.map((c) => {
            const active = counsellorId === c.id;
            return (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => {
                  setCounsellorId(c.id);
                  setSelected(null);
                }}
                className={`flex items-center gap-3 rounded-(--radius-card) border bg-surface p-4 text-left shadow-(--shadow-card) transition-colors ${
                  active ? "border-brand-light" : "border-line hover:border-line-strong"
                }`}
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-tint text-brand-ink">
                  <UserIcon className="h-[1.3rem] w-[1.3rem]" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-ink">{c.name}</span>
                  {c.specialization && (
                    <span className="block truncate text-sm text-ink-muted">
                      {c.specialization}
                    </span>
                  )}
                  {c.yearsOfExperience != null && (
                    <span className="block text-xs text-ink-muted">
                      {c.yearsOfExperience} yrs experience
                    </span>
                  )}
                </span>
                <AvailabilityChip available />
              </button>
            );
          })}
        </div>
      </section>

      {/* Date — the calendar. */}
      {counsellorId && (
        <section>
          <h2 className="t-h2">Select a Date</h2>
          <p className="t-body mt-1">
            Choose your preferred session date from the calendar.
          </p>
          <div className="mt-3">
            <Calendar value={date} onSelect={setDate} />
          </div>
        </section>
      )}

      {/* Slots — a two-column grid. */}
      {counsellorId && date && (
        <section>
          <h2 className="t-h2">Available Time Slots</h2>
          <p className="t-body mt-1">Slots for {prettyDate(date)}</p>
          <div className="mt-3 rounded-(--radius-card) border border-line bg-surface p-4 shadow-(--shadow-card)">
            {slotsLoading ? (
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="skeleton h-11" />
                ))}
                <span className="sr-only">Checking availability…</span>
              </div>
            ) : slots && slots.length > 0 ? (
              <div className="grid grid-cols-2 gap-3" role="radiogroup">
                {slots.map((slot) => {
                  const unavailable = slot.booked || slot.past;
                  const active = selected?.startTime === slot.startTime;
                  return (
                    <button
                      key={slot.startTime}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      disabled={unavailable}
                      onClick={() => setSelected(slot)}
                      className={`rounded-(--radius-btn) px-3 py-3 text-sm font-semibold transition-colors ${
                        active
                          ? "bg-brand-light text-ink-strong"
                          : unavailable
                            ? "cursor-not-allowed bg-sunken-2 text-line-strong"
                            : "bg-sunken text-ink hover:bg-line"
                      }`}
                    >
                      {formatTimeRange(hhmm(slot.startTime), hhmm(slot.endTime))}
                      {unavailable && (
                        <span className="sr-only">
                          {slot.past ? " (past)" : " (already booked)"}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="t-body">
                No open times that day — another day might suit better.
              </p>
            )}
          </div>
        </section>
      )}

      {/* Optional note + confirm. */}
      {counsellorId && date && selected && (
        <section className="flex flex-col gap-3">
          <label htmlFor="reason" className="text-sm font-semibold text-ink">
            Anything you&apos;d like them to know beforehand? (optional)
          </label>
          <textarea
            id="reason"
            rows={3}
            maxLength={500}
            className="w-full resize-y rounded-(--radius-input) border border-line bg-surface px-3.5 py-2.5 text-[0.9375rem] leading-relaxed text-ink placeholder:text-ink-muted focus:border-brand-light focus:outline-none"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </section>
      )}

      {error && (
        <p
          role="alert"
          className="rounded-(--radius-input) bg-red-tint px-3.5 py-2.5 text-sm font-semibold text-red-ink"
        >
          {error}
        </p>
      )}

      <Button
        type="submit"
        size="lg"
        fullWidth
        disabled={!counsellorId || !date || !selected || submitting}
      >
        {submitting ? "Sending request…" : "Confirm Booking"}
      </Button>
    </form>
  );
}
