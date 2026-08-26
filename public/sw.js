/* Minimal service worker — its only job is to exist and have a fetch
   handler, which is what makes Chrome/Android consider the site
   "installable" in the first place. No offline caching: every request
   just passes straight through to the network, so this can never
   serve stale content. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
