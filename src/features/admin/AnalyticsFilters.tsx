"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

// Filters live in the URL, not component state: an admin looking at something
// alarming can send the link and the other person sees the same window.
export function AnalyticsFilters({
  departments,
  from,
  to,
  departmentId,
  groupBy,
}: {
  departments: Array<{ id: string; name: string }>;
  from: string;
  to: string;
  departmentId?: string;
  groupBy: "week" | "month";
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    startTransition(() => router.push(`/admin?${next.toString()}`));
  };

  const field =
    "w-full rounded-(--radius-input) border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-brand-light focus:outline-none";

  return (
    <div
      className={`grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 ${
        pending ? "opacity-60" : ""
      }`}
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="from" className="text-xs font-semibold text-ink">
          From
        </label>
        <input
          id="from"
          type="date"
          value={from}
          max={to}
          className={field}
          onChange={(e) => set("from", e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="to" className="text-xs font-semibold text-ink">
          To
        </label>
        <input
          id="to"
          type="date"
          value={to}
          min={from}
          className={field}
          onChange={(e) => set("to", e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="dept" className="text-xs font-semibold text-ink">
          Department
        </label>
        <select
          id="dept"
          value={departmentId ?? ""}
          className={field}
          onChange={(e) => set("departmentId", e.target.value)}
        >
          <option value="">All departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="groupBy" className="text-xs font-semibold text-ink">
          Group by
        </label>
        <select
          id="groupBy"
          value={groupBy}
          className={field}
          onChange={(e) => set("groupBy", e.target.value)}
        >
          <option value="week">Week</option>
          <option value="month">Month</option>
        </select>
      </div>
    </div>
  );
}
