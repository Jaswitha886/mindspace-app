"use client";

import { useEffect, useState } from "react";
import { THEME_COOKIE, type Theme } from "@/features/theme/theme";

// Light / Dark / System, as a segmented control.
//
// "System" is the absence of a cookie, not a third stored value — that way the
// OS switching to dark at sunset is followed rather than frozen at whatever it
// happened to be when the choice was made.
//
// The DOM is updated immediately and the cookie written alongside it: the
// attribute is what the eye sees now, the cookie is what the *server* reads on
// the next navigation so the correct palette is in the HTML before first paint.

type Choice = Theme | "system";

const OPTIONS: Array<{ value: Choice; label: string }> = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

function apply(choice: Choice) {
  const root = document.documentElement;
  if (choice === "system") {
    root.removeAttribute("data-theme");
    // Expire it — absence is what "system" means.
    document.cookie = `${THEME_COOKIE}=; path=/; max-age=0; samesite=lax`;
  } else {
    root.setAttribute("data-theme", choice);
    document.cookie = `${THEME_COOKIE}=${choice}; path=/; max-age=31536000; samesite=lax`;
  }
}

export function ThemeToggle() {
  // Rendered from the DOM rather than a prop so it can't disagree with what the
  // page is actually showing. Read after mount: the server has no idea what the
  // OS preference is, so guessing here would flicker the wrong segment.
  const [choice, setChoice] = useState<Choice | null>(null);

  useEffect(() => {
    const attr = document.documentElement.getAttribute("data-theme");
    setChoice(attr === "light" || attr === "dark" ? attr : "system");
  }, []);

  return (
    <div
      role="group"
      aria-label="Colour theme"
      className="inline-flex gap-1 rounded-(--radius-pill) bg-sunken p-1"
    >
      {OPTIONS.map((o) => {
        const active = choice === o.value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            onClick={() => {
              apply(o.value);
              setChoice(o.value);
            }}
            className={`rounded-(--radius-pill) px-3.5 py-1.5 text-sm font-semibold transition-all duration-200 ${
              active
                ? "bg-brand text-white shadow-(--shadow-btn)"
                : "text-ink-secondary hover:text-ink hover:bg-sunken"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
