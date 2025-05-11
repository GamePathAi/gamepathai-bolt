// Service Worker Version
const CACHE_VERSION = 'v1';
const CACHE_NAME = `gamepath-ai-${CACHE_VERSION}`;

// Assets to cache
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/robots.txt'
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(ASSETS_TO_CACHE)
          .catch((error) => {
            console.error('Failed to cache assets:', error);
            // Continue with installation even if caching fails
            return Promise.resolve();
          });
      })
  );
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name.startsWith('gamepath-ai-') && name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        );
      })
      .catch((error) => {
        console.error('Cache cleanup failed:', error);
      })
  );
  self.clients.claim();
});

// Fetch event
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip non-HTTP(S) requests
  if (!event.request.url.startsWith('http')) return;

  // Handle navigation requests
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match('/index.html'))
        .catch((error) => {
          console.error('Navigation fetch failed:', error);
          return new Response('Navigation failed. Please check your connection.', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' }
          });
        })
    );
    return;
  }

  // Handle API requests
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .catch((error) => {
          console.error('API request failed:', error);
          return new Response(JSON.stringify({ error: 'Network request failed' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
    return;
  }

  // Handle other requests
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }

        return fetch(event.request)
          .then((response) => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            // Cache the fetched resource
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache)
                  .catch((error) => {
                    console.error('Failed to cache response:', error);
                  });
              })
              .catch((error) => {
                console.error('Failed to open cache:', error);
              });

            return response;
          })
          .catch((error) => {
            console.error('Fetch failed:', error);
            // Return cached version as fallback if available
            return caches.match(event.request);
          });
      })
  );
});

// Handle client errors
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