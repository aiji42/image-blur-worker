import { Hono } from 'hono';
import { HTMLRewriterElementContentHandlers } from '@cloudflare/workers-types/2021-11-03/index';
const app = new Hono();

app.get('/_blur/:src', (c) => {
	const src = c.req.param('src');

	return fetch(src, {
		cf: {
			image: {
				blur: 100,
				fit: 'scale-down',
				width: 200,
				height: 200,
				format: 'webp',
				quality: 60,
			},
			cacheEverything: true,
			cacheTtl: 3600,
		},
	});
});

app.get('*', async (c) => {
	const proxiedUrl = new URL(c.req.url);
	proxiedUrl.host = 'image-gallery-example-neon.vercel.app';
	const res = await fetch(proxiedUrl, c.req.raw);
	const isHtml = res.headers.get('content-type')?.includes('text/html');
	if (!isHtml || c.req.query('raw')) return res;

	return new HTMLRewriter().on(ImageSrcWriter.selector, new ImageSrcWriter()).transform(res);
});

export default app;

class ImageSrcWriter implements HTMLRewriterElementContentHandlers {
	static selector = 'img';
	element(element: Element) {
		const src = element.getAttribute('src');
		console.log(src);
		if (!src) return;
		element.setAttribute('src', `/_blur/${encodeURIComponent(src)}`);
	}
}
