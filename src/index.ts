import { Hono } from 'hono';
import swScript from '../public/service-worker.js'
import loadSwScript from '../public/load-sw.js'
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

app.get('/service-worker.js', (c) => {
	return c.body(swScript, 200, {
		'Content-Type': 'text/javascript'
	})
})

app.get('*', async (c) => {
	const proxiedUrl = new URL(c.req.url);
	proxiedUrl.host = 'image-gallery-example-neon.vercel.app';
	const res = await fetch(proxiedUrl, c.req.raw);
	const isHtml = res.headers.get('content-type')?.includes('text/html');
	if (!isHtml || c.req.query('raw')) return res;

	return new HTMLRewriter().on(LoadSW.selector, new LoadSW()).on(ImageSrcRewriter.selector, new ImageSrcRewriter()).transform(res);
});

export default app;

class ImageSrcRewriter implements HTMLRewriterElementContentHandlers {
	static selector = 'img';
	element(element: Element) {
		const src = element.getAttribute('src');
		if (!src) return;
		element.setAttribute('src', `/_blur/${encodeURIComponent(src)}`);
		element.setAttribute('data-original-src', src);
	}
}

class LoadSW implements HTMLRewriterElementContentHandlers {
	static selector = 'head'
	element(element: Element) {
		element.append(`<script>${loadSwScript}</script>`, { html: true })
	}
}
