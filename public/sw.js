self.addEventListener("push", (event) => {
  const payload = event.data ? event.data.json() : {};
  const title = payload.title || "MindSpace";
  const options = {
    body: payload.body || "You have a new update.",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    data: { url: payload.url || "/counsellor/notifications" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url || "/"));
});
