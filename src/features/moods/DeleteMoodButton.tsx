"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteMoodButton({ moodId }: { moodId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onDelete() {
    if (!window.confirm("Delete this mood entry?")) return;
    setBusy(true);
    await fetch(`/api/student/moods/${moodId}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <button
      onClick={onDelete}
      disabled={busy}
      className="shrink-0 text-xs font-semibold text-red-ink hover:underline disabled:text-ink-muted"
    >
      {busy ? "Deleting…" : "Delete"}
    </button>
  );
}
