import { clientsClaim } from "workbox-core";
import { precacheAndRoute, createHandlerBoundToURL } from "workbox-precaching";
import { registerRoute, NavigationRoute } from "workbox-routing";
import { NetworkOnly } from "workbox-strategies";

self.skipWaiting();
clientsClaim();

// Precache the build output (vite-plugin-pwa injects the manifest at build time).
precacheAndRoute(self.__WB_MANIFEST);

// SPA fallback: any navigation that isn't an API call resolves to index.html,
// matching the previous generateSW navigateFallback/navigateFallbackDenylist.
registerRoute(
  new NavigationRoute(createHandlerBoundToURL("/index.html"), {
    denylist: [/^\/api/],
  })
);

// API requests are never served from the cache.
registerRoute(({ url }) => url.pathname.startsWith("/api/"), new NetworkOnly());

// --- Personal AI Assistant: Web Push ---
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "V.O.I.C.E. NL Assistant";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "",
      icon: "/pwa/icon-192.png",
      badge: "/pwa/icon-192.png",
      data: { url: data.url || "/dashboard/ai-assistant" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/dashboard/ai-assistant";
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clientsArr) => {
      const existing = clientsArr.find((c) => c.url.includes(targetUrl));
      if (existing) return existing.focus();
      return self.clients.openWindow(targetUrl);
    })
  );
});
