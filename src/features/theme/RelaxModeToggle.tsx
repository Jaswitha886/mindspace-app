"use client";

import { useEffect, useState } from "react";

const COOKIE = "mindspace-relax";

export function RelaxModeToggle() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const active = document.cookie.split("; ").some((item) => item === `${COOKIE}=1`);
    document.documentElement.toggleAttribute("data-relax", active);
    setEnabled(active);
  }, []);

  function toggle() {
    const next = !enabled;
    document.documentElement.toggleAttribute("data-relax", next);
    document.cookie = `${COOKIE}=${next ? "1" : ""}; path=/; max-age=${next ? 31536000 : 0}; samesite=lax`;
    setEnabled(next);
  }

  return (
    <button type="button" role="switch" aria-checked={enabled} onClick={toggle} className={`flex w-full items-center justify-between gap-4 rounded-(--radius-input) border px-4 py-3 text-left transition-colors ${enabled ? "border-teal bg-teal-tint" : "border-line bg-surface hover:bg-sunken"}`}>
      <span><span className="block text-sm font-semibold text-ink">Relax mode</span><span className="mt-0.5 block text-xs text-ink-muted">Softer contrast and reduced motion for student pages.</span></span>
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${enabled ? "bg-teal" : "bg-line-strong"}`}><span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${enabled ? "translate-x-5" : "translate-x-0.5"}`} /></span>
    </button>
  );
}
