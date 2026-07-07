// Kill-switch service worker. A pre-launch deployment at this domain left a
// service worker installed on some devices, and it kept serving the old app
// because its script URL fell through to the SPA rewrite (200 text/html) —
// browsers never replace a worker unless its script URL serves valid JS.
// This worker evicts every cache, unregisters itself, and reloads open tabs
// so affected devices recover the live site. Keep this file deployed.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: "window" });
      for (const client of clients) {
        client.navigate(client.url);
      }
    })()
  );
});
