import type { Mood } from "@prisma/client";

// Mood is a categorical enum (confirmed Phase 1 decision, not a numeric scale).
// Trend math needs an app-layer ordinal: higher = better wellbeing.
export const MOOD_ORDINAL: Record<Mood, number> = {
  STRESSED: 0,
  SAD: 1,
  ANXIOUS: 2,
  NEUTRAL: 3,
  CALM: 4,
  HAPPY: 5,
};

export const MOOD_LABEL: Record<Mood, string> = {
  HAPPY: "Happy",
  CALM: "Calm",
  NEUTRAL: "Neutral",
  ANXIOUS: "Anxious",
  SAD: "Sad",
  STRESSED: "Stressed",
};

export const MOODS_IN_ORDER: Mood[] = [
  "HAPPY",
  "CALM",
  "NEUTRAL",
  "ANXIOUS",
  "SAD",
  "STRESSED",
];

/** Emoji shown alongside labels — severity/meaning must never be color-only. */
export const MOOD_EMOJI: Record<Mood, string> = {
  HAPPY: "😊",
  CALM: "😌",
  NEUTRAL: "😐",
  ANXIOUS: "😟",
  SAD: "😢",
  STRESSED: "😣",
};

/**
 * Circle fills for the mood buttons: a dusk spectrum running gold → teal →
 * lilac → orchid → indigo → berry. Decorative only — every circle carries an
 * emoji and a text label, so meaning never rides on colour. (This is why the
 * set is free to be harmonised to the palette rather than a green→red key.)
 */
export const MOOD_COLOR: Record<Mood, string> = {
  HAPPY: "#E8B04B",
  CALM: "#8FB8BF",
  NEUTRAL: "#C9BBD1",
  ANXIOUS: "#B96AA0",
  SAD: "#6E6BB8",
  STRESSED: "#C4455E",
};
