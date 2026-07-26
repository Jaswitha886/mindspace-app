"use client";

import { motion } from "framer-motion";
import type { Mood } from "@prisma/client";
import { MOOD_COLOR, MOOD_FACE_INK, MOOD_LABEL, MOODS_IN_ORDER } from "@/features/moods/mood-meta";
import { MoodFace } from "@/features/moods/MoodFace";

const circleVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: (i: number) => ({
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 15,
      delay: i * 0.06,
    },
  }),
};

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
      {MOODS_IN_ORDER.map((m, i) => {
        const active = value === m;
        return (
          <motion.button
            key={m}
            type="button"
            onClick={() => onSelect(m)}
            disabled={disabled}
            aria-pressed={active}
            custom={i}
            variants={circleVariants}
            initial="hidden"
            animate="visible"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="group flex w-14 shrink-0 flex-col items-center gap-1.5 disabled:opacity-60"
          >
            <motion.span
              className={`grid ${box} place-items-center rounded-full transition-shadow duration-200 ${
                active
                  ? "ring-2 ring-[#a29bfe] ring-offset-2 ring-offset-[var(--surface)] shadow-lg shadow-[#6c5ce730]"
                  : "ring-0 ring-offset-2"
              }`}
              style={{ backgroundColor: MOOD_COLOR[m], color: MOOD_FACE_INK }}
              animate={active ? { scale: [1, 1.15, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              <MoodFace mood={m} className="h-8 w-8" />
            </motion.span>
            <span
              className={`text-[0.6875rem] leading-tight ${
                active ? "font-semibold text-ink" : "font-semibold text-ink-muted"
              }`}
            >
              {MOOD_LABEL[m]}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
