self.addEventListener('install', async () => {
	await self.skipWaiting();
	console.log('installed service worker')
});

self.addEventListener('activate', (event) => {
	event.waitUntil(clients.claim());
	console.log('activated service worker')
});

self.addEventListener('fetch', (event) => {
	const url = new URL(event.request.url);

	if (url.pathname.startsWith('/_blur/')) {
		event.waitUntil((async () => {
			const originalImageUrl = decodeURIComponent(url.pathname.replace('/_blur/', ''));
			console.log('fetching original image:', originalImageUrl)
			const originalImageRes  = await fetch(originalImageUrl)
			const cache = await caches.open('original-images')
			await cache.put(originalImageUrl, originalImageRes);
		})())
	}
});
