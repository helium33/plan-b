/*
 * Retires a service worker this address used to have.
 *
 * Before it served this app, plan-b-vision-b2b.netlify.app hosted the POS,
 * which is an installable app with an offline cache (a service worker at
 * /sw.js). Browsers that visited then still have it, and it keeps answering
 * every page with the cached POS — so those visitors see the POS here instead
 * of the catalogue. This app has no service worker of its own.
 *
 * Browsers re-check /sw.js on each visit. Serving this file makes them
 * install it in place of the old one; it deletes the old caches, unregisters
 * itself and reloads open tabs, which then load this app from the network.
 * After that nothing is registered and this file is never fetched again.
 */
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      await self.registration.unregister();
      const windows = await self.clients.matchAll({ type: 'window' });
      for (const client of windows) client.navigate(client.url);
    })(),
  );
});
