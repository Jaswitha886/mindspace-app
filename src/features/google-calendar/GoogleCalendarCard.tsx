"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

// Google Calendar connection status and controls. Shown on the counsellor
// profile page. Uses the OAuth flow: GET /api/auth/google redirects to
// Google, callback stores tokens, DELETE /api/auth/google disconnects.

export function GoogleCalendarCard({ connected }: { connected: boolean }) {
  const router = useRouter();
  const [isConnected, setIsConnected] = useState(connected);
  const [disconnecting, setDisconnecting] = useState(false);

  // Check URL params for callback result
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("google") === "connected") {
      setIsConnected(true);
      window.history.replaceState({}, "", window.location.pathname);
    } else if (params.get("google") === "error") {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  async function handleDisconnect() {
    setDisconnecting(true);
    const res = await fetch("/api/auth/google", { method: "DELETE" });
    if (res.ok) {
      setIsConnected(false);
      router.refresh();
    }
    setDisconnecting(false);
  }

  return (
    <div>
      <h2 className="t-h2">Google Calendar</h2>
      <p className="t-body mt-1 mb-4">
        {isConnected
          ? "Your Google Calendar is connected. Approved appointments will appear there automatically."
          : "Connect your Google Calendar so approved appointments show up alongside your personal events."}
      </p>

      {isConnected ? (
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-(--radius-pill) bg-success-tint px-3 py-1.5 text-sm font-semibold text-success-ink">
            <span className="h-2 w-2 rounded-full bg-success" />
            Connected
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDisconnect}
            disabled={disconnecting}
          >
            {disconnecting ? "Disconnecting…" : "Disconnect"}
          </Button>
        </div>
      ) : (
        <Button
          variant="primary"
          size="md"
          onClick={() => {
            window.location.href = "/api/auth/google";
          }}
        >
          Connect Google Calendar
        </Button>
      )}
    </div>
  );
}
