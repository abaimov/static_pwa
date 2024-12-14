const staticCacheName = 's-app-v3';
const dynamicCacheName = 'd-app-v3';

const assetUrls = [
  'index.html',
  '/js/app.js',
  '/css/styles.css',
  'offline.html', // Статическая страница оффлайна
];

self.addEventListener('install', async event => {
  const cache = await caches.open(staticCacheName);
  await cache.addAll(assetUrls); // Добавляем статичные файлы в кэш
});

self.addEventListener('activate', async event => {
  const cacheNames = await caches.keys();
  await Promise.all(
      cacheNames
          .filter(name => name !== staticCacheName)
          .filter(name => name !== dynamicCacheName)
          .map(name => caches.delete(name))
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  if (url.origin === location.origin) {
    // Если запрос на тот же домен (например, HTML, CSS, JS файлы)
    event.respondWith(cacheFirst(request));
  } else if (url.pathname.startsWith('/api/')) {
    // Если запрос на динамические данные (например, API запросы)
    event.respondWith(networkFirst(request));
  } else {
    // Для всех остальных внешних запросов (например, картинки, шрифты)
    event.respondWith(cacheFirst(request));
  }
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  return cached ?? await fetch(request); // Возвращаем из кэша или с сети
}

async function networkFirst(request) {
  const cache = await caches.open(dynamicCacheName);
  try {
    const response = await fetch(request);
    await cache.put(request, response.clone()); // Сохраняем динамичные данные в кэш
    return response; // Возвращаем данные из сети
  } catch (e) {
    const cached = await cache.match(request);
    return cached ?? await caches.match('/offline.html'); // Если нет интернета, показываем offline.html
  }
}
