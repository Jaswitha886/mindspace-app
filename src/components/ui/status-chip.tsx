import type { AppointmentStatus } from "@prisma/client";

// Status pills. Always a word, never colour alone — and every fill/label pair
// here clears AA.

const STATUS: Record<AppointmentStatus, { label: string; cls: string }> = {
  PENDING: {
    label: "Pending",
    cls: "bg-gold text-gold-ink",
  },
  APPROVED: {
    label: "Confirmed",
    cls: "bg-success-tint text-success-ink",
  },
  COMPLETED: {
    label: "Completed",
    cls: "bg-sunken text-ink-secondary",
  },
  REJECTED: {
    label: "Declined",
    cls: "bg-red-tint text-red-ink",
  },
  CANCELLED: {
    label: "Cancelled",
    cls: "bg-sunken text-ink-secondary",
  },
};

export function StatusChip({ status }: { status: AppointmentStatus }) {
  const s = STATUS[status];
  return (
    <span
      className={`inline-flex items-center rounded-(--radius-pill) px-2.5 py-1 text-xs font-semibold ${s.cls}`}
    >
      {s.label}
    </span>
  );
}

// Solid availability pill on the counsellor list.
export function AvailabilityChip({ available }: { available: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-(--radius-pill) px-2.5 py-1 text-xs font-semibold text-white ${
        available ? "bg-success" : "bg-red"
      }`}
    >
      {available ? "Active" : "Inactive"}
    </span>
  );
}

// Severity, counsellor/admin only. Green/amber/red is the one severity language
// app-wide; the fills are deepened so a white label clears AA (a literal amber
// would sit at 1.7:1).
export type Severity = "MILD" | "MODERATE" | "CRITICAL";

const SEVERITY: Record<Severity, { label: string; cls: string }> = {
  MILD: { label: "Mild", cls: "bg-mild" },
  MODERATE: { label: "Moderate", cls: "bg-moderate" },
  CRITICAL: { label: "Critical", cls: "bg-critical" },
};

export function SeverityChip({ severity }: { severity: Severity }) {
  const s = SEVERITY[severity];
  return (
    <span
      className={`inline-flex items-center rounded-(--radius-pill) px-4 py-1.5 text-sm font-semibold text-white ${s.cls}`}
    >
      {s.label}
    </span>
  );
}
