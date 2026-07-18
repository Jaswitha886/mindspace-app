import type { Mood } from "@prisma/client";
import type { ReactNode } from "react";

// Bold, minimal mood faces on a 24×24 grid. Stroke-based with clear features
// that read at small sizes (28px+). The swatch provides the coloured circle;
// we draw only the expression inside.

const FACES: Record<Mood, ReactNode> = {
  HAPPY: (
    <>
      <circle cx="9.5" cy="10" r="1.2" />
      <circle cx="14.5" cy="10" r="1.2" />
      <path d="M8.5 14.2 Q12 17 15.5 14.2" />
    </>
  ),
  CALM: (
    <>
      <path d="M8 10.5 Q9.5 12 11 10.5" />
      <path d="M13 10.5 Q14.5 12 16 10.5" />
      <path d="M9.5 14.8 Q12 16.2 14.5 14.8" />
    </>
  ),
  NEUTRAL: (
    <>
      <circle cx="9.5" cy="10" r="1.2" />
      <circle cx="14.5" cy="10" r="1.2" />
      <path d="M10 15 L14 15" />
    </>
  ),
  ANXIOUS: (
    <>
      <path d="M7.5 8.5 L10.5 8" />
      <path d="M16.5 8.5 L13.5 8" />
      <circle cx="9.5" cy="10.5" r="1.2" />
      <circle cx="14.5" cy="10.5" r="1.2" />
      <path d="M10 15.5 Q12 14 14 15.5" />
    </>
  ),
  SAD: (
    <>
      <circle cx="9.5" cy="10" r="1.2" />
      <circle cx="14.5" cy="10" r="1.2" />
      <path d="M9 15.8 Q12 13.5 15 15.8" />
    </>
  ),
  STRESSED: (
    <>
      <path d="M7.5 8 L10.5 9.2" />
      <path d="M16.5 8 L13.5 9.2" />
      <circle cx="9.5" cy="10.5" r="1.2" />
      <circle cx="14.5" cy="10.5" r="1.2" />
      <path d="M10 15.5 L14 15.5" />
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
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {FACES[mood]}
    </svg>
  );
}
