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

/**
 * Soft tinted circles for the mood swatches — muted, distinct hues, deliberately
 * *light* so a single fixed dark face reads on every one of them (see
 * MOOD_FACE_INK). The face is drawn by MoodFace, not an emoji; the tint is
 * decorative and the text label always accompanies it, so meaning never rides
 * on colour. Fixed values (not theme tokens): a swatch is a self-contained chip
 * — light circle + dark face — that looks the same in light and dark mode.
 */
export const MOOD_COLOR: Record<Mood, string> = {
  HAPPY: "#F7E3BE", // warm honey
  CALM: "#CFE8DE", // soft green
  NEUTRAL: "#E1E7E1", // quiet sage-grey
  ANXIOUS: "#E7DEF1", // muted lilac
  SAD: "#D7E2F1", // soft blue
  STRESSED: "#F3D8D8", // muted rose
};

/** The face stroke on every swatch — one fixed dark ink that clears the soft
 *  tints above in both themes. */
export const MOOD_FACE_INK = "#26352b";
