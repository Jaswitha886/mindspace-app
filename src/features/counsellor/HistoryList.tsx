"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { AppointmentStatus } from "@/generated/prisma/client";
import { SearchIcon } from "@/components/icons";
import { Card } from "@/components/ui/card";
import { SeverityChip, StatusChip, type Severity } from "@/components/ui/status-chip";

export type HistoryRow = {
  id: string;
  studentName: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  note: { severity: Severity; content: string } | null;
};

export function HistoryList({ rows }: { rows: HistoryRow[] }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => rows.filter((row) => row.studentName.toLowerCase().includes(query.trim().toLowerCase())), [query, rows]);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative max-w-md">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by student name" className="w-full rounded-(--radius-input) border border-line bg-surface py-2.5 pl-10 pr-3.5 text-sm text-ink placeholder:text-ink-muted focus:border-brand-light focus:outline-none" />
      </div>
      {filtered.length === 0 ? (
        <p className="t-body">No past sessions match that search.</p>
      ) : (
        <Card>
          <ul className="flex flex-col">
            {filtered.map((row) => (
              <li key={row.id} className="border-b border-line py-4 first:pt-0 last:border-0 last:pb-0">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[0.9375rem] font-semibold text-ink">{row.studentName}</p>
                    <p className="t-meta mt-0.5">{row.date} · {row.time}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2"><StatusChip status={row.status} />{row.note && <SeverityChip severity={row.note.severity} />}</div>
                </div>
                {row.note && <p className="mt-3 line-clamp-2 rounded-(--radius-input) bg-sunken px-3 py-2 text-sm leading-relaxed text-ink-secondary">{row.note.content}</p>}
                <Link href={`/counsellor/notes/${row.id}`} className="mt-3 inline-flex text-sm font-semibold text-brand-ink hover:underline">{row.note ? "Edit note" : "Add note"}</Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
