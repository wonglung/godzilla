'use strict';

// Bump this version whenever a cached shell file changes.
const CACHE_PREFIX = `repair-pwa-${self.registration.scope}-`;
const CACHE_NAME = `${CACHE_PREFIX}v1`;
const SHELL_FILES = [
  './', './index.html', './style.css', './app.js', './pwa.js', './config.js',
  './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png',
  './icons/icon-maskable-512.png', './icons/apple-touch-icon.png'
];
const SHELL_URLS = new Set(SHELL_FILES.map(path => new URL(path, self.registration.scope).href));
const SDK_URL = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js';

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_FILES)));
  // Wait for existing app windows to close before activating an updated shell.
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
      .map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  // Database reads and writes always go to the network. Never cache repair records or queue submissions.
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  const shellUrl = `${url.origin}${url.pathname}`;
  if (SHELL_URLS.has(shellUrl)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      return await cache.match(shellUrl) || fetch(request);
    })());
  } else if (request.url === SDK_URL) {
    // Only cache a readable, successful SDK response; offline use is optional if CDN access failed before.
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok && response.type !== 'opaque') await cache.put(request, response.clone());
      return response;
    })());
  }
});
