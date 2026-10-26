// ======================================
// SERVICE WORKER PARA ALYHA PRINT PWA
// ======================================
// Este archivo permite que la aplicación funcione offline
// y proporciona una experiencia nativa de aplicación

const CACHE_NAME = 'alyha-v1';
const URLS_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.json'
];

// ======================================
// INSTALACIÓN DEL SERVICE WORKER
// ======================================
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Cache abierto');
                return cache.addAll(URLS_TO_CACHE);
            })
            .catch(err => {
                console.log('Error al cachear archivos:', err);
            })
    );
    self.skipWaiting();
});

// ======================================
// ACTIVACIÓN DEL SERVICE WORKER
// ======================================
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Eliminando cache antiguo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// ======================================
// INTERCEPTAR SOLICITUDES (FETCH)
// ======================================
self.addEventListener('fetch', event => {
    // Solo cachear solicitudes GET
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Si la respuesta está en cache, devolverla
                if (response) {
                    return response;
                }

                // Si no está en cache, hacer la solicitud a la red
                return fetch(event.request)
                    .then(response => {
                        // No cachear respuestas no-OK
                        if (!response || response.status !== 200 || response.type === 'error') {
                            return response;
                        }

                        // Clonar la respuesta
                        const responseToCache = response.clone();

                        // Cachear la respuesta
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    })
                    .catch(error => {
                        // Si falla la red y no está en cache, devolver página offline
                        console.log('Error de red:', error);

                        // Intentar devolver de cache como fallback
                        return caches.match(event.request)
                            .then(response => {
                                return response || new Response(
                                    '<html><body><h1>Sin conexión</h1><p>Parece que no tienes conexión a internet.</p></body></html>',
                                    { headers: { 'Content-Type': 'text/html' } }
                                );
                            });
                    });
            })
    );
});

// ======================================
// SINCRONIZACIÓN EN SEGUNDO PLANO (OPCIONAL)
// ======================================
// Permite sincronizar datos cuando vuelve la conexión
self.addEventListener('sync', event => {
    if (event.tag === 'sync-orders') {
        event.waitUntil(
            // Aquí irían las acciones de sincronización
            Promise.resolve()
        );
    }
});

// ======================================
// NOTIFICACIONES PUSH (OPCIONAL)
// ======================================
// Para enviar notificaciones a los usuarios
self.addEventListener('push', event => {
    if (!event.data) {
        return;
    }

    const data = event.data.json();
    const options = {
        body: data.body || 'Nueva actualización de Alyha Print',
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect fill="%239D00FF" width="192" height="192"/><text x="50%" y="50%" font-size="100" font-weight="bold" fill="%23FF006E" text-anchor="middle" dominant-baseline="central" font-family="Arial">A</text></svg>',
        badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><text x="48" y="48" font-size="70" text-anchor="middle" dominant-baseline="central">✨</text></svg>',
        tag: data.tag || 'alyha-notification',
        requireInteraction: false
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'Alyha Print', options)
    );
});

// ======================================
// MENSAJE DESDE EL CLIENTE
// ======================================
// Recibir mensajes de la página principal
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

console.log('Service Worker cargado exitosamente');
