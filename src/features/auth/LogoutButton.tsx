"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogoutIcon } from "@/components/icons";

// Sign out, with a confirmation step so a stray click doesn't end the session.
//
// Two-step rather than a modal: the first click arms it, the second confirms.
// No dialog infrastructure, and it degrades cleanly for both shapes — the full
// button swaps its label to a Confirm/Cancel pair, the icon-only button (sidebar
// and mobile bar) reveals the same pair beside itself. Arming auto-disarms on a
// click elsewhere or after a few seconds, so it never gets stuck half-committed.
export function LogoutButton({
  variant = "secondary",
  size = "sm",
  className = "",
  iconOnly = false,
}: {
  variant?: "secondary" | "outline";
  size?: "sm" | "md";
  className?: string;
  iconOnly?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [armed, setArmed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function arm() {
    setArmed(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setArmed(false), 4000);
  }
  function disarm() {
    setArmed(false);
    if (timer.current) clearTimeout(timer.current);
  }

  // Clicking anywhere else cancels an armed confirm — treat it as intent to
  // leave the button alone, not a trap the user has to escape.
  useEffect(() => {
    if (!armed) return;
    const onDocClick = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest("[data-logout]")) disarm();
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [armed]);

  async function confirm() {
    setBusy(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  if (iconOnly) {
    return (
      <span data-logout className="flex items-center gap-1">
        {armed ? (
          <>
            <button
              onClick={confirm}
              disabled={busy}
              className="rounded-(--radius-btn) bg-red px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-red-ink disabled:opacity-60"
            >
              {busy ? "…" : "Sign out"}
            </button>
            <button
              onClick={disarm}
              disabled={busy}
              className="rounded-(--radius-btn) px-2 py-1 text-xs font-semibold text-ink-muted hover:text-ink"
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            onClick={arm}
            aria-label="Sign out"
            title="Sign out"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-(--radius-btn) text-ink-muted transition-colors duration-150 hover:bg-sunken hover:text-red-ink"
          >
            <LogoutIcon className="h-[1.15rem] w-[1.15rem]" />
          </button>
        )}
      </span>
    );
  }

  if (armed) {
    return (
      <span data-logout className="inline-flex items-center gap-2">
        <Button variant="destructive" size={size} onClick={confirm} disabled={busy}>
          {busy ? "Signing out…" : "Sign out?"}
        </Button>
        <Button variant="secondary" size={size} onClick={disarm} disabled={busy}>
          Cancel
        </Button>
      </span>
    );
  }

  return (
    <span data-logout>
      <Button variant={variant} size={size} onClick={arm} className={className}>
        Sign out
      </Button>
    </span>
  );
}
