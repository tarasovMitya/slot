const CACHE = "slot-v1";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (e) => {
  if (!e.data) return;
  let payload;
  try { payload = e.data.json(); } catch { payload = { title: "SLOT", body: e.data.text(), url: "/" }; }

  const { title = "SLOT", body = "", url = "/", icon = "/favicon.svg", tag } = payload;

  e.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      tag: tag ?? `slot-${Date.now()}`,
      data: { url },
      badge: "/favicon.svg",
    })
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = e.notification.data?.url ?? "/";
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (new URL(client.url).origin === self.location.origin) {
          client.focus();
          client.postMessage({ type: "NOTIFICATION_CLICK", url });
          return;
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
