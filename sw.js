const CACHE_NAME = 'youmiki-cache-v9';
const ASSETS = [
  'index.html',
  'manifest.json'
];

// Installazione del Service Worker e salvataggio dei file in cache
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Attivazione e pulizia delle vecchie cache
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Gestione delle richieste di rete (Strategia: Network First per i dati aggiornati di YouTube)
self.addEventListener('fetch', (e) => {
  // Ignora le richieste alle API di Google (devono essere sempre live)
  if (e.request.url.includes('googleapis.com')) {
    return;
  }
  
  e.respondWith(
    fetch(e.request)
      .then((response) => {
        // Se la rete risponde, aggiorna la cache per i file locali
        if (response && response.status === 200 && ASSETS.includes(e.request.url.split('/').pop())) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Se sei offline, recupera dalla cache
        return caches.match(e.request);
      })
  );
});
