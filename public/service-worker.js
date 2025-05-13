
//
// Service Worker Version
const CACHE_VERSION = 'v1';
const CACHE_NAME = `gamepath-ai-${CACHE_VERSION}`;

// Assets to cache
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/robots.txt',
  '/locales/en/common.json',
  '/locales/en/auth.json',
  '/locales/en/dashboard.json',
  '/locales/en/settings.json'
];

// Domains to skip interception
const SKIP_DOMAINS = [
  'github.com',
  'githubusercontent.com',
  'api.github.com',
  'example.com',
  'supabase.co',
  'iafamwvctehdltqmnhyx.supabase.co'
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);

        // Cache core assets individually to handle failures gracefully
        for (const asset of ASSETS_TO_CACHE) {
          try {
            await cache.add(asset);
            console.log(`Successfully cached: ${asset}`);
          } catch (error) {
            console.warn(`Failed to cache ${asset}:`, error);
          }
        }
      } catch (error) {
        console.error('Cache initialization failed:', error);
      }
    })()
  );
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        // Clean up old caches
        const keys = await caches.keys();
        await Promise.all(
          keys
            .filter(key => key.startsWith('gamepath-ai-') && key !== CACHE_NAME)
            .map(key => caches.delete(key))
        );

        await self.clients.claim();
      } catch (error) {
        console.error('Cache cleanup failed:', error);
      }
    })()
  );
});

// Helper function to check if a request should be skipped
function shouldSkipRequest(url) {
  return SKIP_DOMAINS.some(domain => url.includes(domain));
}

// Helper function to check if a request is for a download
function isDownloadRequest(request) {
  return request.url.includes('/releases/') &&
    (request.url.endsWith('.exe') ||
      request.url.endsWith('.dmg') ||
      request.url.endsWith('.AppImage'));
}

// Helper function to add security headers
function addSecurityHeaders(response) {
  const headers = new Headers(response.headers);
  headers.set('Content-Security-Policy', "default-src 'self'");
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-XSS-Protection', '1; mode=block');
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

// Fetch event
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip non-HTTP(S) requests
  if (!event.request.url.startsWith('http')) return;

  // Skip specific domains
  if (shouldSkipRequest(event.request.url)) {
    return;
  }

  // Handle download requests
  if (isDownloadRequest(event.request)) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

          // Add security headers and proper content type
          const headers = new Headers(response.headers);
          headers.set('Content-Type', 'application/octet-stream');
          headers.set('Content-Disposition', 'attachment');

          return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers
          });
        })
        .catch(error => {
          console.error('Download error:', error);
          // No throw here - just log. Could return a fallback response instead if wanted.
          // return new Response('Falha ao baixar arquivo. Tente novamente mais tarde.', { status: 503, headers: { 'Content-Type': 'text/plain' } });
        })
    );
    return;
  }

  // Handle navigation requests
  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(event.request);
          return addSecurityHeaders(response);
        } catch (error) {
          const cache = await caches.open(CACHE_NAME);
          const cachedResponse = await cache.match('/index.html');
          if (cachedResponse) {
            return addSecurityHeaders(cachedResponse);
          }
          return new Response('Navigation failed. Please check your connection.', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' }
          });
        }
      })()
    );
    return;
  }

  // Handle API requests
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(event.request);
          return addSecurityHeaders(response);
        } catch (error) {
          return new Response(JSON.stringify({ error: 'Network request failed' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      })()
    );
    return;
  }

  // Handle other requests with cache-first strategy
  event.respondWith(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(event.request);
        if (cachedResponse) {
          return addSecurityHeaders(cachedResponse);
        }

        const response = await fetch(event.request);
        if (response.ok && response.type === 'basic') {
          cache.put(event.request, response.clone());
        }
        return addSecurityHeaders(response);
      } catch (error) {
        console.error('Fetch failed:', error);
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return addSecurityHeaders(cachedResponse);
        }
        // No throw here - prevents Uncaught (in promise) errors in console.
        // Could optionally return a custom offline response here.
      }
    })()
  );
});

// Handle client messages
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Error handling
self.addEventListener('error', (event) => {
  console.error('Service worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('Service worker unhandled rejection:', event.reason);
});

// (linha vazia no final para boas práticas)