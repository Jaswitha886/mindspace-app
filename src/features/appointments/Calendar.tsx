"use client";

import { useState } from "react";
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
} from "@/components/icons";

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

function dateFromKey(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatSelectedDate(key: string) {
  return dateFromKey(key).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

// Booking calendar with month navigation, unavailable past dates, and a selected day.
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

  const daysAhead = value
    ? Math.round(
        (dateFromKey(value).getTime() - new Date(todayY, todayM, todayD).getTime()) /
          86_400_000,
      )
    : null;
  const bookingWindowProgress =
    daysAhead === null
      ? 0
      : Math.max(8, Math.min(100, ((daysAhead + 1) / (maxDaysAhead + 1)) * 100));
  const selectedDateLabel = value ? formatSelectedDate(value) : "Choose a day";
  const distanceLabel =
    daysAhead === null
      ? `Appointments open for the next ${maxDaysAhead} days`
      : daysAhead === 0
        ? "Available today"
        : daysAhead === 1
          ? "Available tomorrow"
          : `${daysAhead} days from today`;

  const step = (delta: number) => {
    const d = new Date(view.year, view.month + delta, 1);
    setView({ year: d.getFullYear(), month: d.getMonth() });
  };

  return (
    <div className="overflow-hidden rounded-(--radius-card) border border-line bg-surface shadow-(--shadow-card)">
      <div className="border-b border-brand-light bg-brand-tint px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-(--radius-btn) bg-surface text-brand">
              <CalendarIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink-strong">Session date</p>
              <p className="truncate text-sm text-ink">{selectedDateLabel}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-ink-muted">
            <ClockIcon className="h-4 w-4" />
            <span>{maxDaysAhead} day window</span>
          </div>
        </div>
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between gap-3 text-xs">
            <span className="font-medium text-ink">{distanceLabel}</span>
            <span className="shrink-0 text-ink-muted">Booking range</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-surface/80">
            <div
              className="h-full rounded-full bg-brand transition-[width] duration-200"
              style={{ width: `${bookingWindowProgress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => step(-1)}
            disabled={atFirstMonth}
            aria-label="Previous month"
            className="grid h-9 w-9 place-items-center rounded-(--radius-btn) border border-line bg-surface text-ink transition-colors hover:bg-sunken disabled:border-transparent disabled:text-line-strong disabled:hover:bg-surface"
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
            className="grid h-9 w-9 place-items-center rounded-(--radius-btn) border border-line bg-surface text-ink transition-colors hover:bg-sunken disabled:border-transparent disabled:text-line-strong disabled:hover:bg-surface"
          >
            <ChevronRightIcon className="h-[1.15rem] w-[1.15rem]" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-1">
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
            const isToday = key === todayKey;
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
                    ? "bg-brand font-semibold text-white shadow-sm"
                    : disabled
                      ? "cursor-not-allowed text-line-strong"
                      : isToday
                        ? "border border-brand font-semibold text-brand hover:bg-brand-tint"
                        : "font-semibold text-ink hover:bg-sunken"
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
