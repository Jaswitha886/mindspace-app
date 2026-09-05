// A white panel with a hairline and a soft shadow, rounded to
// --radius-card. `tone` swaps the fill for one of the palette's blocks.

type Tone = "paper" | "plum" | "gold" | "teal" | "sunken";

const toneClasses: Record<Tone, string> = {
  paper: "bg-surface border border-line",
  plum: "bg-brand-tint border border-transparent",
  gold: "bg-gold border border-transparent",
  teal: "bg-teal-tint border border-transparent",
  sunken: "bg-sunken border border-line",
};

export function Card({
  className = "",
  interactive = false,
  tone = "paper",
  children,
}: {
  className?: string;
  interactive?: boolean;
  tone?: Tone;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-(--radius-card) p-5 shadow-(--shadow-card) ${
        toneClasses[tone]
      } ${interactive ? "lift" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

// Square shortcut tile ("Book Session", "Journaling"): centred icon over a
// label.
export function ActionTile({
  icon,
  label,
  tone = "plum",
  className = "",
}: {
  icon: React.ReactNode;
  label: string;
  tone?: "plum" | "sunken";
  className?: string;
}) {
  return (
    <span
      className={`flex flex-col items-center justify-center gap-2.5 rounded-(--radius-card) px-4 py-6 text-center ${
        tone === "plum" ? "bg-brand-tint" : "bg-sunken border border-line"
      } ${className}`}
    >
      <span className="text-brand-ink">{icon}</span>
      <span className="text-sm font-semibold text-ink">{label}</span>
    </span>
  );
}
