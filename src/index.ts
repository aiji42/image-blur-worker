import { Hono } from 'hono';
import imageLoaderScript from '../public/image-loader.js';
const app = new Hono();

const blurFetchOption = {
	cf: {
		image: {
			blur: 64,
			fit: 'scale-down',
			width: 200,
			height: 200,
			format: 'webp',
			quality: 50,
		},
		cacheEverything: true,
		cacheTtl: 3600,
	},
} as const;

app.get('/_blur/:src', (c) => {
	const src = c.req.param('src');

	return fetch(src, blurFetchOption);
});

app.get('*', async (c) => {
	const res = await fetch(proxy(c.req.url), c.req.raw);
	const isHtml = res.headers.get('content-type')?.includes('text/html');
	if (!isHtml || c.req.query('raw')) return res;

	const imgSrcRewriter = new ImageSrcRewriter();
	const rewroteResponse = new HTMLRewriter()
		.on(ImageSrcRewriter.selector, imgSrcRewriter)
		.on(ImageLoaderScript.selector, new ImageLoaderScript())
		.transform(res);

	c.executionCtx.waitUntil(
		(async (res: Response) => {
			await res.arrayBuffer();
			await Promise.allSettled([...imgSrcRewriter.srcSet].map((src) => fetch(src, blurFetchOption)));
		})(rewroteResponse.clone()),
	);

	return rewroteResponse;
});

export default app;

const proxy = (_url: string) => {
	const url = new URL(_url);
	url.protocol = 'https';
	url.hostname = 'image-gallery-example-neon.vercel.app';
	url.port = '';

	return url;
};

class ImageSrcRewriter implements HTMLRewriterElementContentHandlers {
	static selector = 'img';
	public srcSet: Set<string> = new Set();
	element(element: Element) {
		const src = element.getAttribute('src');
		if (!src) return;
		element.setAttribute('src', `/_blur/${encodeURIComponent(src)}`);
		element.setAttribute('data-src', src);

		this.srcSet.add(src);
	}
}

class ImageLoaderScript implements HTMLRewriterElementContentHandlers {
	static selector = 'body';
	element(element: Element) {
		element.append(`<script>${imageLoaderScript}</script>`, { html: true });
	}
}
