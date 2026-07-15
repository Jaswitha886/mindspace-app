"use client";

import { useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** YYYY-MM-DD from calendar parts — never via toISOString, which shifts the
 *  day for anyone east or west of UTC. */
export function ymd(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// The reference's "Select a Date" calendar: month header with arrows, a
// Sun–Sat grid, past days greyed out, the chosen day a solid orange circle.
export function Calendar({
  value,
  onSelect,
  maxDaysAhead = 60,
}: {
  value: string;
  onSelect: (date: string) => void;
  maxDaysAhead?: number;
}) {
  const now = new Date();
  const todayY = now.getFullYear();
  const todayM = now.getMonth();
  const todayD = now.getDate();
  const todayKey = ymd(todayY, todayM, todayD);

  const last = new Date(todayY, todayM, todayD + maxDaysAhead);
  const lastKey = ymd(last.getFullYear(), last.getMonth(), last.getDate());

  const [view, setView] = useState({ year: todayY, month: todayM });

  const firstWeekday = new Date(view.year, view.month, 1).getDay();
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();

  const atFirstMonth = view.year === todayY && view.month === todayM;
  const atLastMonth =
    view.year === last.getFullYear() && view.month === last.getMonth();

  const step = (delta: number) => {
    const d = new Date(view.year, view.month + delta, 1);
    setView({ year: d.getFullYear(), month: d.getMonth() });
  };

  return (
    <div className="rounded-(--radius-card) border border-line bg-surface p-4 shadow-(--shadow-card)">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => step(-1)}
          disabled={atFirstMonth}
          aria-label="Previous month"
          className="grid h-9 w-9 place-items-center rounded-(--radius-btn) text-ink transition-colors hover:bg-sunken disabled:text-line-strong disabled:hover:bg-transparent"
        >
          <ChevronLeftIcon className="h-[1.15rem] w-[1.15rem]" />
        </button>
        <p aria-live="polite" className="text-[1.0625rem] font-semibold text-ink-strong">
          {MONTHS[view.month]} {view.year}
        </p>
        <button
          type="button"
          onClick={() => step(1)}
          disabled={atLastMonth}
          aria-label="Next month"
          className="grid h-9 w-9 place-items-center rounded-(--radius-btn) text-ink transition-colors hover:bg-sunken disabled:text-line-strong disabled:hover:bg-transparent"
        >
          <ChevronRightIcon className="h-[1.15rem] w-[1.15rem]" />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-1 text-center text-xs font-semibold text-ink-muted">
            {w}
          </div>
        ))}
        {Array.from({ length: firstWeekday }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const key = ymd(view.year, view.month, day);
          const disabled = key < todayKey || key > lastKey;
          const selected = key === value;
          return (
            <button
              key={key}
              type="button"
              disabled={disabled}
              aria-pressed={selected}
              aria-label={`${day} ${MONTHS[view.month]} ${view.year}`}
              onClick={() => onSelect(key)}
              className={`mx-auto grid h-9 w-9 place-items-center rounded-full text-sm transition-colors ${
                selected
                  ? "bg-brand-light font-semibold text-ink-strong"
                  : disabled
                    ? "cursor-not-allowed text-line-strong"
                    : "font-semibold text-ink hover:bg-sunken"
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
