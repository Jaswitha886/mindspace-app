// Empty and loading states: a muted outline icon, a title, a short explanation,
// and (optionally) the one action that resolves it. Loading is a skeleton stack.

export function EmptyState({
  icon,
  title,
  body,
  action,
  className = "",
}: {
  icon: React.ReactNode;
  title: string;
  body?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col items-center gap-3 rounded-(--radius-card) border border-line bg-surface px-6 py-10 text-center shadow-(--shadow-card) ${className}`}
    >
      <span className="text-brand-light">{icon}</span>
      <h3 className="t-h3">{title}</h3>
      {body && <p className="t-body max-w-xs">{body}</p>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

export function SkeletonList({
  rows = 3,
  label = "Loading…",
}: {
  rows?: number;
  label?: string;
}) {
  return (
    <div
      className="rounded-(--radius-card) border border-line bg-surface p-5 shadow-(--shadow-card)"
      role="status"
      aria-live="polite"
    >
      <p className="t-h3 mb-4">{label}</p>
      <div className="flex flex-col gap-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="skeleton h-14 w-full" />
        ))}
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );
}
