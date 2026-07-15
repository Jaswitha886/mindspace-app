"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { SeverityWeek } from "@/features/counsellor/dashboard-data";
import { SEVERITY_META } from "@/features/notes/severity-meta";

// The counsellor's own sessions over time, stacked by severity. Clinical data:
// the tooltip names every band, and the card header carries a counted legend,
// so severity is never read from colour alone. No recharts <Legend> here —
// that header legend is the legend.

function SeverityTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((sum, p) => sum + (p.value ?? 0), 0);
  if (total === 0) return null;
  return (
    <div className="rounded-(--radius-input) border border-line bg-surface px-3 py-2 shadow-(--shadow-pop)">
      <p className="text-xs font-semibold text-ink">Week of {label}</p>
      {payload
        .filter((p) => p.value > 0)
        .map((p) => (
          <p key={p.name} className="mt-1 flex items-center gap-1.5 text-xs">
            <span
              aria-hidden
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: p.color }}
            />
            <span className="text-ink-secondary">{p.name}</span>
            <span className="font-semibold text-ink">{p.value}</span>
          </p>
        ))}
    </div>
  );
}

export function SeverityTrendChart({ data }: { data: SeverityWeek[] }) {
  const total = data.reduce((s, w) => s + w.MILD + w.MODERATE + w.CRITICAL, 0);

  if (total === 0) {
    return (
      <p className="t-body py-6 text-center">
        No session notes yet. Once you write them, your severity pattern over
        time appears here.
      </p>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <XAxis
            dataKey="label"
            tick={{ fill: "var(--ink-muted)", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: "var(--ink-muted)", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={28}
          />
          <Tooltip content={<SeverityTooltip />} cursor={{ fill: "var(--sunken)" }} />
          {SEVERITY_META.map((b) => (
            <Bar
              key={b.key}
              dataKey={b.key}
              name={b.label}
              stackId="severity"
              fill={b.fill}
              isAnimationActive={false}
              radius={b.key === "CRITICAL" ? [4, 4, 0, 0] : undefined}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
