"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { InputField } from "@/components/ui/field";
import { UserIcon } from "@/components/icons";

// The counsellor's walk-in picker: type a name or register number, pick a
// student, and their session starts immediately.
//
// Search is debounced and fired against /api/students. Picking a result posts
// to /api/appointments/walk-in; on success the page refreshes into the "In
// session" state, so this component doesn't render its own success — the whole
// card swaps out from under it.

type Student = {
  id: string;
  name: string;
  registerNumber: string | null;
  department: string | null;
};

export function WalkInSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Student[]>([]);
  const [searching, setSearching] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  function onChange(value: string) {
    setQuery(value);
    setError(null);
    if (debounce.current) clearTimeout(debounce.current);
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    debounce.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/students?q=${encodeURIComponent(value.trim())}`);
        const json = await res.json();
        setResults(json.success ? json.data.students : []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 250);
  }

  async function start(student: Student) {
    setStarting(true);
    setError(null);
    const res = await fetch("/api/appointments/walk-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: student.id }),
    });
    const json = await res.json();
    setStarting(false);
    if (!res.ok || !json.success) {
      setError(json.message ?? "Couldn't start the walk-in.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      <InputField
        label="Find a student"
        id="walkin-search"
        value={query}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Name or register number"
        autoComplete="off"
        spellCheck={false}
      />

      {query.trim().length >= 2 && (
        <div aria-live="polite">
          {searching && results.length === 0 ? (
            <p className="t-meta">Searching…</p>
          ) : results.length === 0 ? (
            <p className="t-meta">No students match “{query.trim()}”.</p>
          ) : (
            <ul className="flex flex-col overflow-hidden rounded-(--radius-input) border border-line">
              {results.map((s) => (
                <li key={s.id} className="border-b border-line last:border-0">
                  <button
                    type="button"
                    disabled={starting}
                    onClick={() => start(s)}
                    className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-brand-tint disabled:opacity-60"
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-tint text-brand-ink">
                      <UserIcon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[0.9375rem] font-semibold text-ink">
                        {s.name}
                      </span>
                      <span className="block truncate text-xs text-ink-muted">
                        {[s.registerNumber, s.department].filter(Boolean).join(" · ") ||
                          "Student"}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm font-semibold text-red-ink">
          {error}
        </p>
      )}
    </div>
  );
}
