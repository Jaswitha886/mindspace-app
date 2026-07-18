"use client";

import type { Mood } from "@prisma/client";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { MOOD_FACE_INK, MOOD_LABEL, MOOD_ORDINAL } from "@/features/moods/mood-meta";
import { MoodFace } from "@/features/moods/MoodFace";

export type MoodPoint = { logDate: string; mood: Mood };

const ORDINAL_TO_LABEL = Object.fromEntries(
  Object.entries(MOOD_ORDINAL).map(([mood, ord]) => [ord, MOOD_LABEL[mood as Mood]]),
);

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });

function MoodTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: { date: string; mood: Mood } }>;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-(--radius-input) border border-line bg-surface px-3 py-2 shadow-(--shadow-pop)">
      <p className="text-sm font-semibold text-ink">
        <MoodFace mood={point.mood} className="inline-block h-4 w-4 align-middle" /> {MOOD_LABEL[point.mood]}
      </p>
      <p className="text-xs text-ink-muted">{shortDate(point.date)}</p>
    </div>
  );
}

// The reference's mood trend: a smooth orange line with round dots and a bare
// day axis. It draws no y-axis at all, which leaves the line meaningless — the
// mood words stay here, and the history list below is the text alternative.
export function MoodTrendChart({ moods }: { moods: MoodPoint[] }) {
  const data = [...moods]
    .sort((a, b) => a.logDate.localeCompare(b.logDate))
    .map((m) => ({
      date: m.logDate,
      mood: m.mood,
      value: MOOD_ORDINAL[m.mood],
    }));

  if (data.length < 2) {
    return (
      <p className="t-body">
        A few more days and a picture will start to form here — no rush.
      </p>
    );
  }

  return (
    <div aria-label="Mood trend" role="img" className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <XAxis
            dataKey="date"
            tickFormatter={shortDate}
            tick={{ fill: "var(--ink-muted)", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            minTickGap={28}
          />
          <YAxis
            domain={[0, 5]}
            ticks={[0, 1, 2, 3, 4, 5]}
            tickFormatter={(v: number) => ORDINAL_TO_LABEL[v] ?? ""}
            tick={{ fill: "var(--ink-muted)", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={72}
          />
          <Tooltip content={<MoodTooltip />} cursor={{ stroke: "var(--border)" }} />
          <Line
            type="monotone"
            dataKey="value"
            stroke="var(--brand-light)"
            strokeWidth={2.5}
            dot={{ r: 3.5, fill: "var(--brand-light)", strokeWidth: 0 }}
            activeDot={{ r: 5.5 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
