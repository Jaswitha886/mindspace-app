import type { SeverityLevel } from "@prisma/client";

// The single source of truth for how severity looks and reads, shared by the
// counsellor chart, the admin distribution, and the pills. Import this rather
// than re-declaring colours per view — that is how "critical" ended up red on
// one card and amber on the next.
//
// `fill` is the lighter hue, for bars and dots that carry no text.
// `pill` is the deepened, AA-safe hue for a white label. See globals.css.
export const SEVERITY_META = [
  {
    key: "MILD",
    label: "Mild",
    fill: "var(--sev-mild-fill)",
    pill: "bg-mild",
  },
  {
    key: "MODERATE",
    label: "Moderate",
    fill: "var(--sev-moderate-fill)",
    pill: "bg-moderate",
  },
  {
    key: "CRITICAL",
    label: "Critical",
    fill: "var(--sev-critical-fill)",
    pill: "bg-critical",
  },
] as const satisfies ReadonlyArray<{
  key: SeverityLevel;
  label: string;
  fill: string;
  pill: string;
}>;

export type SeverityCounts = Record<SeverityLevel, number>;
