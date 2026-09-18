import { PlusIcon } from "@/components/icons";

export type CardTone =
  | "paper"
  | "plum"
  | "gold"
  | "teal"
  | "sunken"
  | "blue"
  | "green"
  | "orange"
  | "red";

type CardPadding = "none" | "sm" | "md" | "lg";

const toneClasses: Record<CardTone, string> = {
  paper: "card-tone-paper",
  plum: "card-tone-plum",
  gold: "card-tone-gold",
  teal: "card-tone-teal",
  sunken: "card-tone-sunken",
  blue: "card-tone-blue",
  green: "card-tone-green",
  orange: "card-tone-orange",
  red: "card-tone-red",
};

const paddingClasses: Record<CardPadding, string> = {
  none: "",
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
};

export function Card({
  className = "",
  interactive = false,
  tone = "paper",
  padding = "md",
  children,
  ...props
}: {
  className?: string;
  interactive?: boolean;
  tone?: CardTone;
  padding?: CardPadding;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`mind-card ${toneClasses[tone]} ${paddingClasses[padding]} ${
        interactive ? "lift" : ""
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardProgress({
  value,
  label = "Progress",
  valueLabel,
  className = "",
}: {
  value: number;
  label?: string;
  valueLabel?: string;
  className?: string;
}) {
  const boundedValue = Math.max(0, Math.min(100, value));

  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-3 text-xs font-semibold text-[var(--card-muted)]">
        <span>{label}</span>
        <span>{valueLabel ?? `${Math.round(boundedValue)}%`}</span>
      </div>
      <div className="mind-card-progress mt-2" aria-label={`${label}: ${Math.round(boundedValue)}%`}>
        <span style={{ width: `${boundedValue}%` }} />
      </div>
    </div>
  );
}

export function AvatarStack({
  people,
  max = 2,
}: {
  people: Array<{ name: string; imageUrl?: string }>;
  max?: number;
}) {
  const visiblePeople = people.slice(0, max);
  const remaining = people.length - visiblePeople.length;

  return (
    <div className="flex items-center" aria-label={`${people.length} participants`}>
      {visiblePeople.map((person, index) => (
        <span
          key={person.name}
          className={`flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border-2 border-[var(--card-accent)] bg-surface text-[0.625rem] font-bold text-ink ${
            index > 0 ? "-ml-2" : ""
          }`}
          title={person.name}
        >
          {person.imageUrl ? (
            <img src={person.imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            person.name.slice(0, 2).toUpperCase()
          )}
        </span>
      ))}
      {remaining > 0 && (
        <span className="-ml-2 flex h-7 w-7 items-center justify-center rounded-full border-2 border-[var(--card-accent)] bg-surface text-[0.625rem] font-bold text-ink-muted">
          +{remaining}
        </span>
      )}
    </div>
  );
}

export function AddParticipantButton({ className = "" }: { className?: string }) {
  return (
    <button
      type="button"
      aria-label="Add participant"
      className={`inline-flex h-7 w-7 items-center justify-center rounded-full border border-dashed border-[var(--card-accent)] text-[var(--card-ink)] transition-colors hover:bg-surface/45 ${className}`}
    >
      <PlusIcon className="h-3.5 w-3.5" />
    </button>
  );
}

export function ActionTile({
  icon,
  label,
  tone = "plum",
  className = "",
}: {
  icon: React.ReactNode;
  label: string;
  tone?: "plum" | "sunken" | "blue" | "green" | "orange" | "red";
  className?: string;
}) {
  return (
    <span
      className={`mind-card ${toneClasses[tone]} flex flex-col items-center justify-center gap-2.5 px-4 py-6 text-center ${className}`}
    >
      <span className="text-brand-ink">{icon}</span>
      <span className="text-sm font-semibold text-ink">{label}</span>
    </span>
  );
}
