"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeftIcon } from "@/components/icons";

// Top-left "Back" on every page except the role's home.
//
// Home is the root of each role's area — there is nowhere "up" from it, and the
// nav already puts every top-level page one tap away. A Back button there would
// only ever walk you out of the app or into your own browsing history, which is
// what the browser's own control is for.
//
// This is history-back, so it goes wherever you actually came from. That's the
// honest behaviour of a Back control; the trade-off is that it can't name its
// destination.
//
// It also hides when there's nothing behind it (a fresh tab, or a page opened
// directly), because a Back button that does nothing is worse than no button:
// you click it, the page doesn't move, and you stop trusting the control.
export function BackButton({ home }: { home: string }) {
  // Rendered only after mount: history length is a client fact, and guessing it
  // on the server would flash a button that then disappears.
  const [canGoBack, setCanGoBack] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setCanGoBack(window.history.length > 1);
  }, []);

  if (pathname === home || !canGoBack) return null;

  // Owns its own bottom margin rather than sitting in a spacer in the shell:
  // the shell is a server component and can't know whether this renders, so a
  // spacer there would leave an empty gap at the top of every home page.
  return (
    <div className="mb-2">
      <button
        type="button"
        onClick={() => router.back()}
        className="-ml-1.5 inline-flex items-center gap-1 rounded-(--radius-btn) px-1.5 py-1 text-sm font-semibold text-ink-muted transition-colors hover:text-brand-ink"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Back
      </button>
    </div>
  );
}
