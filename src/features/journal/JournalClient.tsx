"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, IconButton } from "@/components/ui/button";
import { InputField, TextareaField } from "@/components/ui/field";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { JournalIcon, PencilIcon, PlusIcon } from "@/components/icons";

export type JournalEntry = {
  id: string;
  title: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
};

const isoDay = (iso: string) => iso.slice(0, 10); // cards are labelled by ISO day

function EntryEditor({ entry, onDone }: { entry?: JournalEntry; onDone: () => void }) {
  const router = useRouter();
  const [title, setTitle] = useState(entry?.title ?? "");
  const [content, setContent] = useState(entry?.content ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) {
      setError("Write something first.");
      return;
    }
    setBusy(true);
    setError(null);
    const res = await fetch(
      entry ? `/api/student/journal/${entry.id}` : "/api/student/journal",
      {
        method: entry ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim() || undefined, content }),
      },
    );
    const body = await res.json().catch(() => null);
    setBusy(false);
    if (!res.ok || !body?.success) {
      setError(body?.message ?? "Couldn't save the entry — try again.");
      return;
    }
    onDone();
    router.refresh();
  }

  return (
    <form onSubmit={onSave} className="flex flex-col gap-5">
      <InputField
        label="Title (optional)"
        id={`title-${entry?.id ?? "new"}`}
        value={title}
        maxLength={150}
        onChange={(e) => setTitle(e.target.value)}
      />
      <TextareaField
        label="Entry"
        id={`content-${entry?.id ?? "new"}`}
        rows={6}
        placeholder="Whatever's on your mind…"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      {error && (
        <p
          role="alert"
          className="rounded-(--radius-input) bg-red-tint px-3.5 py-2.5 text-sm font-semibold text-red-ink"
        >
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2.5">
        <Button type="submit" disabled={busy}>
          {busy ? "Saving…" : "Save entry"}
        </Button>
        <Button type="button" variant="secondary" onClick={onDone}>
          Discard
        </Button>
        {entry && (
          <Button
            type="button"
            variant="destructive"
            className="ml-auto"
            onClick={async () => {
              if (!window.confirm("Delete this entry? This can't be undone.")) return;
              await fetch(`/api/student/journal/${entry.id}`, { method: "DELETE" });
              onDone();
              router.refresh();
            }}
          >
            Delete
          </Button>
        )}
      </div>
    </form>
  );
}

export function JournalClient({ entries }: { entries: JournalEntry[] }) {
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-5">
      {creating && (
        <Card>
          <EntryEditor onDone={() => setCreating(false)} />
        </Card>
      )}

      {entries.length === 0 && !creating ? (
        <EmptyState
          icon={<JournalIcon className="h-12 w-12" />}
          title="No Journal Entries Yet"
          body="It looks like you haven't logged any thoughts. Whatever you write stays between you and this page."
          action={<Button onClick={() => setCreating(true)}>Write My First Entry</Button>}
        />
      ) : (
        // Plum entry cards: date and a pencil on the top row, the
        // title, then two lines of the body.
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {entries.map((entry) => (
            <li key={entry.id}>
              {editingId === entry.id ? (
                <Card>
                  <EntryEditor entry={entry} onDone={() => setEditingId(null)} />
                </Card>
              ) : (
                <Card tone="plum" className="h-full">
                  <div className="flex items-start justify-between gap-3">
                    <p className="t-meta">{isoDay(entry.createdAt)}</p>
                    <button
                      onClick={() => setEditingId(entry.id)}
                      aria-label={`Edit entry ${entry.title ?? "Untitled"}`}
                      className="-mt-1 -mr-1 shrink-0 rounded-(--radius-input) p-1.5 text-ink-secondary transition-colors hover:bg-surface/60 hover:text-ink"
                    >
                      <PencilIcon className="h-[1.05rem] w-[1.05rem]" />
                    </button>
                  </div>
                  <h2 className="t-h3 mt-1.5">{entry.title ?? "Untitled"}</h2>
                  <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-ink-secondary">
                    {entry.content}
                  </p>
                </Card>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Floating "+" — new entry, always within thumb reach. */}
      {!creating && (
        <div className="fixed right-5 bottom-24 z-20 lg:right-8 lg:bottom-8">
          <IconButton
            label="New journal entry"
            className="h-14 w-14 shadow-(--shadow-pop)"
            onClick={() => {
              setEditingId(null);
              setCreating(true);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            <PlusIcon className="h-6 w-6" />
          </IconButton>
        </div>
      )}
    </div>
  );
}
