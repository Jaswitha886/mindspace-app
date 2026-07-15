export type AffirmationItem = {
  id: string;
  message: string;
  counsellorName: string;
  dateLabel: string;
};

// The affirmation block: a coloured heading over the message. No serif, no
// italic, no reveal animation — a counsellor's note to a student should read
// plainly, not be performed.
export function AffirmationList({ items }: { items: AffirmationItem[] }) {
  if (items.length === 0) {
    return (
      <p className="t-body">
        Notes from your counsellor will appear here after your first session.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {items.map((a) => (
        <li key={a.id} className="border-b border-line pb-4 last:border-0 last:pb-0">
          <p className="text-[0.9375rem] font-semibold text-ink">{a.message}</p>
          <p className="t-meta mt-1">
            {a.counsellorName} · {a.dateLabel}
          </p>
        </li>
      ))}
    </ul>
  );
}
