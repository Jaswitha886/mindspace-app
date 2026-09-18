"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CalendarIcon, CheckIcon, ClockIcon } from "@/components/icons";

export type Slot = {
  id: string;
  isRecurring: boolean;
  dayOfWeek: number | null;
  specificDate: string | null;
  startTime: string;
  endTime: string;
  isActive: boolean;
};

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const DAY_INDICES = [1, 2, 3, 4, 5];
const HOURS = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00"];
const nextHour = (hour: string) => `${String(Number(hour.slice(0, 2)) + 1).padStart(2, "0")}:00`;
const key = (day: number, hour: string) => `${day}-${hour}`;

export function AvailabilityManager({ initial }: { initial: Slot[] }) {
  const router = useRouter();
  const [selectedDay, setSelectedDay] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(() => new Set(
    initial.filter((slot) => slot.isRecurring && slot.isActive && slot.dayOfWeek !== null && HOURS.includes(slot.startTime) && slot.endTime === nextHour(slot.startTime)).map((slot) => key(slot.dayOfWeek!, slot.startTime)),
  ));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const rowsByKey = useMemo(() => new Map(initial.filter((slot) => slot.isRecurring && slot.dayOfWeek !== null && HOURS.includes(slot.startTime) && slot.endTime === nextHour(slot.startTime)).map((slot) => [key(slot.dayOfWeek!, slot.startTime), slot])), [initial]);

  function toggle(hour: string) {
    const value = key(selectedDay, hour);
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(value)) next.delete(value); else next.add(value);
      return next;
    });
    setNotice(null);
  }

  async function request(url: string, init: RequestInit) {
    const response = await fetch(url, init);
    const body = await response.json().catch(() => null);
    if (!response.ok || !body?.success) throw new Error(body?.message ?? "Could not save availability.");
  }

  async function save() {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      for (const day of DAY_INDICES) {
        for (const hour of HOURS) {
          const slotKey = key(day, hour);
          const row = rowsByKey.get(slotKey);
          const enabled = selected.has(slotKey);
          if (row && row.isActive !== enabled) {
            await request(`/api/counsellor/availability/${row.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: enabled }) });
          }
          if (!row && enabled) {
            await request("/api/counsellor/availability", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isRecurring: true, dayOfWeek: day, specificDate: null, startTime: hour, endTime: nextHour(hour) }) });
          }
        }
      }
      // The reference schedule reserves lunch and finishes at 16:00. Retire
      // any legacy one-hour windows that would otherwise remain bookable.
      for (const row of initial) {
        if (row.isRecurring && row.isActive && DAY_INDICES.includes(row.dayOfWeek ?? -1) && ["12:00", "16:00"].includes(row.startTime) && row.endTime === nextHour(row.startTime)) {
          await request(`/api/counsellor/availability/${row.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: false }) });
        }
      }
      setNotice("Weekly availability saved.");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save availability.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <Card tone="plum">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface text-brand-ink"><CalendarIcon className="h-5 w-5" /></span>
          <div><h2 className="t-h2">Slot Timings</h2><ul className="mt-2 space-y-1 text-sm leading-relaxed text-ink-secondary"><li>1-hour slots from 9 AM to 4 PM</li><li>Lunch break: 12 PM to 1 PM</li><li>Toggle slots on or off for each weekday</li></ul></div>
        </div>
      </Card>

      <Card>
        <h2 className="t-h2 text-center">Select Day</h2>
        <div className="mt-4 flex flex-wrap justify-center gap-2.5" role="tablist" aria-label="Weekdays">
          {DAYS.map((day, index) => {
            const value = DAY_INDICES[index];
            const active = value === selectedDay;
            return <button key={day} type="button" role="tab" aria-selected={active} onClick={() => setSelectedDay(value)} className={`inline-flex min-w-28 items-center justify-center gap-2 rounded-(--radius-input) border px-4 py-2 text-sm font-semibold transition-colors ${active ? "border-brand bg-brand-tint text-brand-ink" : "border-line bg-surface text-ink-secondary hover:bg-sunken"}`}>{active && <CheckIcon className="h-4 w-4" />}{day}</button>;
          })}
        </div>

        <h3 className="mt-7 text-base font-semibold text-ink">Available Time Slots</h3>
        <div className="mt-3 flex flex-col gap-2.5">
          {HOURS.map((hour) => {
            const active = selected.has(key(selectedDay, hour));
            return <button key={hour} type="button" role="switch" aria-checked={active} onClick={() => toggle(hour)} className="flex w-full items-center justify-between rounded-(--radius-input) border border-line bg-surface px-4 py-3 text-left shadow-(--shadow-card) transition-colors hover:bg-sunken"><span className="flex items-center gap-4"><ClockIcon className="h-5 w-5 text-ink-muted" /><span className="font-mono text-sm font-semibold text-ink">{hour} - {nextHour(hour)}</span></span><span className={`relative h-6 w-11 rounded-full transition-colors ${active ? "bg-brand" : "bg-line-strong"}`}><span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${active ? "translate-x-5" : "translate-x-0.5"}`} /></span></button>;
          })}
        </div>
        <div className="mt-4 flex items-center gap-3 rounded-(--radius-input) bg-gold px-4 py-3 text-gold-ink"><ClockIcon className="h-5 w-5" /><div><p className="text-sm font-bold">Lunch Break</p><p className="text-xs font-semibold opacity-80">12:00 - 13:00</p></div></div>
      </Card>

      {error && <p role="alert" className="rounded-(--radius-input) bg-red-tint px-3.5 py-2.5 text-sm font-semibold text-red-ink">{error}</p>}
      {notice && <p role="status" className="rounded-(--radius-input) bg-success-tint px-3.5 py-2.5 text-sm font-semibold text-success-ink">{notice}</p>}
      <Button size="lg" fullWidth disabled={busy} onClick={save}><CheckIcon className="h-5 w-5" />{busy ? "Saving availability…" : "Save Availability"}</Button>

      <section>
        <h2 className="t-h2 mb-3">Weekly Summary</h2>
        <div className="flex flex-col gap-2.5">
          {DAYS.map((day, index) => {
            const dayIndex = DAY_INDICES[index];
            const hours = HOURS.filter((hour) => selected.has(key(dayIndex, hour)));
            return <Card key={day} padding="sm"><div className="flex flex-wrap items-center justify-between gap-3"><p className="font-semibold text-ink">{day}</p><span className="rounded-(--radius-pill) border border-line px-3 py-1 text-xs font-semibold text-ink-secondary">{hours.length} slot{hours.length === 1 ? "" : "s"}</span></div>{hours.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{hours.map((hour) => <span key={hour} className="rounded-(--radius-pill) bg-sunken px-2.5 py-1 text-xs font-semibold text-ink-secondary">{hour} - {nextHour(hour)}</span>)}</div>}</Card>;
          })}
        </div>
      </section>
    </div>
  );
}
