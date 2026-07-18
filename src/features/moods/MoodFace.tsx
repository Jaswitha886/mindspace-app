import type { Mood } from "@prisma/client";
import type { ReactNode } from "react";

// Line-art mood faces on the same 24-grid, rounded-stroke system as the app's
// other icons — a grown-up replacement for the emoji. Drawn in currentColor, so
// the swatch sets the (fixed dark) stroke; meaning still rides on the text
// label beside it, never on the face alone.

const EYES = (
  <>
    <circle cx="9" cy="10.4" r="0.75" fill="currentColor" stroke="none" />
    <circle cx="15" cy="10.4" r="0.75" fill="currentColor" stroke="none" />
  </>
);

const FACES: Record<Mood, ReactNode> = {
  HAPPY: (
    <>
      {EYES}
      <path d="M8 14 Q12 17.8 16 14" />
    </>
  ),
  CALM: (
    <>
      {/* Relaxed, closed eyes — gentle downward arcs. */}
      <path d="M7.9 10.6 Q9 11.7 10.1 10.6" />
      <path d="M13.9 10.6 Q15 11.7 16.1 10.6" />
      <path d="M9 14.6 Q12 16.4 15 14.6" />
    </>
  ),
  NEUTRAL: (
    <>
      {EYES}
      <path d="M9 15 H15" />
    </>
  ),
  ANXIOUS: (
    <>
      {/* Raised inner brows + a small worried mouth. */}
      <path d="M7.6 8.9 L10.1 8.1" />
      <path d="M16.4 8.9 L13.9 8.1" />
      {EYES}
      <path d="M9.2 15.6 Q12 14.2 14.8 15.6" />
    </>
  ),
  SAD: (
    <>
      {EYES}
      <path d="M8.4 16 Q12 12.9 15.6 16" />
    </>
  ),
  STRESSED: (
    <>
      {/* Brows angled down + a tense, gritted mouth. */}
      <path d="M7.7 8.2 L10.2 9.3" />
      <path d="M16.3 8.2 L13.8 9.3" />
      {EYES}
      <path d="M9 15.4 H15 M11 14.6 V16.2 M13 14.6 V16.2" />
    </>
  ),
};

export function MoodFace({
  mood,
  className = "h-6 w-6",
}: {
  mood: Mood;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {FACES[mood]}
    </svg>
  );
}
