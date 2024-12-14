const staticCacheName = 's-app-v3';
const dynamicCacheName = 'd-app-v3';

const assetUrls = [
  'index.html',
  '/js/app.js',
  '/css/styles.css',
  'offline.html' // Оффлайн-страница должна быть добавлена в кэш
];

self.addEventListener('install', async event => {
  const cache = await caches.open(staticCacheName);
  await cache.addAll(assetUrls);
  console.log('Service Worker installed and assets cached');
});

self.addEventListener('activate', async event => {
  const cacheNames = await caches.keys();
  await Promise.all(
      cacheNames
          .filter(name => name !== staticCacheName)
          .filter(name => name !== dynamicCacheName)
          .map(name => caches.delete(name))
  );
  console.log('Service Worker activated and old caches cleaned');
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Если запрос идет на наш сайт, используем стратегию cacheFirst
  if (url.origin === location.origin) {
    event.respondWith(cacheFirst(request));
  } else {
    event.respondWith(networkFirst(request));
  }
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  return cached ?? await fetch(request).catch((err) => {
    // Если нет интернета, возвращаем оффлайн страницу
    console.error('Fetch failed; returning offline page', err);
    return caches.match('/offline.html');
  });
}

async function networkFirst(request) {
  const cache = await caches.open(dynamicCacheName);
  try {
    const response = await fetch(request);
    await cache.put(request, response.clone());
    return response;
  } catch (e) {
    console.error('Network request failed; serving from cache', e);
    const cached = await cache.match(request);
    return cached ?? await caches.match('/offline.html'); // Возвращаем оффлайн страницу, если нет интернета
  }
}
