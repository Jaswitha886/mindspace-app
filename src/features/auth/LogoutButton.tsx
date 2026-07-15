"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogoutIcon } from "@/components/icons";

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

  async function onLogout() {
    setBusy(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  if (iconOnly) {
    return (
      <button
        onClick={onLogout}
        disabled={busy}
        aria-label="Sign out"
        title="Sign out"
        className="grid h-9 w-9 shrink-0 place-items-center rounded-(--radius-btn) text-ink-muted transition-colors duration-150 hover:bg-sunken hover:text-red-ink disabled:opacity-60"
      >
        <LogoutIcon className="h-[1.15rem] w-[1.15rem]" />
      </button>
    );
  }

  return (
    <Button variant={variant} size={size} onClick={onLogout} disabled={busy} className={className}>
      {busy ? "Signing out…" : "Sign out"}
    </Button>
  );
}
