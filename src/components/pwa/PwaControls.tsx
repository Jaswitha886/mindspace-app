"use client";

import { useEffect, useState } from "react";
import { BellIcon } from "@/components/icons";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function PwaControls() {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("unsupported");
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if ("Notification" in window) setPermission(Notification.permission);
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  }, []);

  async function enableAlerts() {
    if (!("Notification" in window)) return;
    setPermission(await Notification.requestPermission());
  }

  async function install() {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {permission === "default" && (
        <button type="button" onClick={enableAlerts} className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-ink hover:underline">
          <BellIcon className="h-3.5 w-3.5" />
          Enable browser alerts
        </button>
      )}
      {installEvent && (
        <button type="button" onClick={install} className="text-xs font-semibold text-brand-ink hover:underline">
          Install app
        </button>
      )}
    </div>
  );
}
