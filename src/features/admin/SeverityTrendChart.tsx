"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SEVERITY_META } from "@/features/notes/severity-meta";
import type { SeverityBucket } from "@/features/admin/analytics";

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
  const total = payload.reduce((s, p) => s + (p.value ?? 0), 0);
  if (total === 0) return null;
  return (
    <div className="rounded-(--radius-input) border border-line bg-surface px-3 py-2 shadow-(--shadow-pop)">
      <p className="text-xs font-semibold text-ink">{label}</p>
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

// Campus-wide severity over time. The counted legend lives in the card header,
// so severity is never read from colour alone.
export function AdminSeverityTrendChart({ data }: { data: SeverityBucket[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <XAxis
            dataKey="label"
            tick={{ fill: "var(--ink-muted)", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            minTickGap={12}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: "var(--ink-muted)", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={28}
          />
          <Tooltip content={<SeverityTooltip />} cursor={{ fill: "var(--sunken)" }} />
          {SEVERITY_META.map((s) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.label}
              stackId="severity"
              fill={s.fill}
              isAnimationActive={false}
              radius={s.key === "CRITICAL" ? [4, 4, 0, 0] : undefined}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
