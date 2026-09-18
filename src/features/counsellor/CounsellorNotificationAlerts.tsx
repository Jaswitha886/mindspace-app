"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type Alert = { id: string; studentName: string; reason: string; isRead: boolean };
const STORAGE_KEY = "mindspace-counsellor-notification-ids";

function savedAlertIds() {
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    return new Set(Array.isArray(value) ? value.filter((id): id is string => typeof id === "string") : []);
  } catch {
    return new Set<string>();
  }
}

export function CounsellorNotificationAlerts({ alerts }: { alerts: Alert[] }) {
  const router = useRouter();
  const ready = useRef(false);

  useEffect(() => {
    const interval = window.setInterval(() => router.refresh(), 60_000);
    return () => window.clearInterval(interval);
  }, [router]);

  useEffect(() => {
    const unread = alerts.filter((alert) => !alert.isRead);
    const seen = savedAlertIds();

    if (!ready.current) {
      unread.forEach((alert) => seen.add(alert.id));
      ready.current = true;
    } else if ("Notification" in window && Notification.permission === "granted") {
      unread.filter((alert) => !seen.has(alert.id)).forEach((alert) => {
        const title = "New MindSpace alert";
        const options = {
          body: `${alert.studentName}: ${alert.reason}`,
          icon: "/favicon.ico",
          tag: alert.id,
          data: { url: "/counsellor/notifications" },
        };
        if ("serviceWorker" in navigator) {
          void navigator.serviceWorker.ready.then((registration) => registration.showNotification(title, options));
        } else {
          new Notification(title, options);
        }
      });
    }

    unread.forEach((alert) => seen.add(alert.id));
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...seen].slice(-100)));
  }, [alerts]);

  return null;
}
