/**
 * Service worker do PWA do Supermercado Amazonas.
 *
 * Regras:
 * - Só mexe em GET do próprio site. Nunca intercepta a API (outra origem),
 *   nem POST/PATCH/DELETE (checkout, admin, etc.) — isso sempre vai direto pra rede.
 * - Navegação (abrir uma tela): network-first, com fallback pro cache quando offline.
 *   Evita telas "grudadas" numa versão antiga do app.
 * - Assets estáticos (JS/CSS/imagens do bundle): stale-while-revalidate.
 *
 * Pra forçar os clientes a pegar uma versão nova do próprio sw.js, o navegador já
 * revalida esse arquivo a cada carregamento; bump o VERSION abaixo só se quiser
 * invalidar o cache de assets antigo de propósito.
 */
const VERSION = 'v1';
const CACHE_NAME = `amazonas-pwa-${VERSION}`;

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request);
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, fresh.clone());
          return fresh;
        } catch {
          const cache = await caches.open(CACHE_NAME);
          return (await cache.match(request)) ?? (await cache.match('/')) ?? Response.error();
        }
      })(),
    );
    return;
  }

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(request);
      const network = fetch(request)
        .then((resp) => {
          if (resp.ok) cache.put(request, resp.clone());
          return resp;
        })
        .catch(() => null);
      return cached ?? (await network) ?? Response.error();
    })(),
  );
});
