const CACHE_NAME = 'arthur-calendar-v1';
const APP_SHELL = [
	'/',
	'/calendar/',
	'/manifest.webmanifest',
	'/favicon-32x32.png',
	'/apple-touch-icon.png',
	'/icon-192.png',
	'/icon-512.png',
	'/og-image.jpg',
];

self.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(CACHE_NAME)
			.then((cache) => cache.addAll(APP_SHELL))
			.catch(() => undefined)
	);
	self.skipWaiting();
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) =>
				Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
			)
			.then(() => self.clients.claim())
	);
});

async function networkFirst(request) {
	const cache = await caches.open(CACHE_NAME);
	try {
		const response = await fetch(request);
		if (response.ok) cache.put(request, response.clone());
		return response;
	} catch {
		return (await cache.match(request)) || (await cache.match('/calendar/'));
	}
}

async function cacheFirst(request) {
	const cache = await caches.open(CACHE_NAME);
	const cached = await cache.match(request);
	if (cached) return cached;
	const response = await fetch(request);
	if (response.ok) cache.put(request, response.clone());
	return response;
}

self.addEventListener('fetch', (event) => {
	const { request } = event;
	if (request.method !== 'GET') return;

	const url = new URL(request.url);
	if (url.origin !== self.location.origin) return;

	if (request.mode === 'navigate') {
		event.respondWith(networkFirst(request));
		return;
	}

	if (
		url.pathname.startsWith('/_astro/') ||
		url.pathname.startsWith('/assets/') ||
		url.pathname === '/manifest.webmanifest' ||
		url.pathname.endsWith('.png') ||
		url.pathname.endsWith('.jpg') ||
		url.pathname.endsWith('.webp') ||
		url.pathname.endsWith('.ico')
	) {
		event.respondWith(cacheFirst(request));
	}
});
