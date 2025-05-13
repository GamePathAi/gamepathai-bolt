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

// File extensions for downloads
const DOWNLOAD_EXTENSIONS = [
  '.exe',
  '.dmg',
  '.AppImage',
  '.zip',
  '.tar.gz',
  '.msi'
];

// Domains to skip interception
const SKIP_DOMAINS = [
  'github.com',
  'githubusercontent.com',
  'api.github.com',
  'example.com'
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
            // Continue with other assets even if one fails
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
        
        // Take control of all clients
        await self.clients.claim();
      } catch (error) {
        console.error('Cache cleanup failed:', error);
      }
    })()
  );
});

// Helper function to check if a request should be skipped
function shouldSkipRequest(url) {
  // Skip based on domain
  if (SKIP_DOMAINS.some(domain => url.includes(domain))) {
    return true;
  }
  
  return false;
}

// Helper function to check if a request is for a download file
function isDownloadFile(url) {
  return DOWNLOAD_EXTENSIONS.some(ext => url.toLowerCase().endsWith(ext.toLowerCase()));
}

// Fetch event
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip non-HTTP(S) requests
  if (!event.request.url.startsWith('http')) return;
  
  // Skip specific domains
  if (shouldSkipRequest(event.request.url)) {
    console.log(`Skipping service worker interception for: ${event.request.url}`);
    return;
  }

  // Handle download files
  if (isDownloadFile(event.request.url)) {
    console.log(`Processing download request: ${event.request.url}`);
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          
          // Clone the response to add security headers
          const secureResponse = new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: new Headers({
              ...Object.fromEntries(response.headers.entries()),
              'Content-Type': 'application/octet-stream',
              'Content-Disposition': 'attachment',
              'X-Content-Type-Options': 'nosniff',
              'Content-Security-Policy': "default-src 'none'",
              'X-Download-Options': 'noopen'
            })
          });
          
          console.log(`Download started: ${event.request.url}`);
          return secureResponse;
        })
        .catch(error => {
          console.error(`Download error: ${error}`);
          throw error;
        })
    );
    return;
  }

  // Handle navigation requests
  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          // Try network first for navigation
          const response = await fetch(event.request);
          return response;
        } catch (error) {
          // Network failed, try cache
          const cache = await caches.open(CACHE_NAME);
          const cachedResponse = await cache.match('/index.html');
          if (cachedResponse) {
            return cachedResponse;
          }
          // Both network and cache failed
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
          return response;
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

  // Handle locales requests specially
  if (event.request.url.includes('/locales/')) {
    event.respondWith(
      (async () => {
        try {
          // Try network first for translations
          const response = await fetch(event.request);
          if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(event.request, response.clone());
            return response;
          }
          // Network failed or returned error, try cache
          const cachedResponse = await caches.match(event.request);
          if (cachedResponse) {
            return cachedResponse;
          }
          // Both failed, return empty JSON
          return new Response('{}', {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        } catch (error) {
          console.error('Error handling locale request:', error);
          return new Response('{}', {
            status: 200,
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
        // Try cache first
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }

        // Cache miss, try network
        const response = await fetch(event.request);
        if (response.ok && response.type === 'basic') {
          cache.put(event.request, response.clone());
        }
        return response;
      } catch (error) {
        console.error('Fetch failed:', error);
        // Both cache and network failed
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }
        throw error;
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