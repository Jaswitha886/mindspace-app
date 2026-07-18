"use client";

import type { Mood } from "@prisma/client";
import { MOOD_COLOR, MOOD_FACE_INK, MOOD_LABEL, MOODS_IN_ORDER } from "@/features/moods/mood-meta";
import { MoodFace } from "@/features/moods/MoodFace";

// The reference's "How are you feeling today?" row: big circular colour
// buttons carrying a face. The label under each is not decoration — it's what
// keeps the control usable without colour vision.
export function MoodCircles({
  value,
  onSelect,
  disabled = false,
  size = "md",
}: {
  value: Mood | null;
  onSelect: (m: Mood) => void;
  disabled?: boolean;
  size?: "sm" | "md";
}) {
  const box = size === "sm" ? "h-12 w-12 text-xl" : "h-14 w-14 text-2xl";
  return (
    <div role="group" aria-label="How are you feeling?" className="flex flex-wrap gap-3">
      {MOODS_IN_ORDER.map((m) => {
        const active = value === m;
        return (
          <button
            key={m}
            type="button"
            onClick={() => onSelect(m)}
            disabled={disabled}
            aria-pressed={active}
            className="group flex w-14 shrink-0 flex-col items-center gap-1.5 disabled:opacity-60"
          >
            <span
              className={`grid ${box} place-items-center rounded-full transition-transform duration-150 group-hover:scale-105 ${
                active
                  ? "ring-2 ring-ink-strong ring-offset-2"
                  : "ring-0 ring-offset-2"
              }`}
              style={{ backgroundColor: MOOD_COLOR[m], color: MOOD_FACE_INK }}
            >
              <MoodFace mood={m} className="h-8 w-8" />
            </span>
            <span
              className={`text-[0.6875rem] leading-tight ${
                active ? "font-semibold text-ink" : "font-semibold text-ink-muted"
              }`}
            >
              {MOOD_LABEL[m]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
