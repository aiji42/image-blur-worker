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
	const proxiedUrl = new URL(c.req.url);
	proxiedUrl.host = 'image-gallery-example-neon.vercel.app';
	const res = await fetch(proxiedUrl, c.req.raw);
	const isHtml = res.headers.get('content-type')?.includes('text/html');
	if (!isHtml || c.req.query('raw')) return res;

	const imgSrcRewriter = new ImageSrcRewriter();

	const rewroteResponse = new HTMLRewriter()
		.on(ImageLoaderScript.selector, new ImageLoaderScript())
		.on(ImageSrcRewriter.selector, imgSrcRewriter)
		.on(EmbeddedCss.selector, new EmbeddedCss(proxiedUrl.toString()))
		.transform(res);

	c.executionCtx.waitUntil(Promise.allSettled([...imgSrcRewriter.srcSet].map((src) => fetch(src, blurFetchOption))));

	return rewroteResponse;
});

export default app;

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

class EmbeddedCss implements HTMLRewriterElementContentHandlers {
	static selector = 'link';
	private baseUrl = '';
	constructor(baseUrl: string) {
		this.baseUrl = baseUrl;
	}
	async element(element: Element) {
		const href = element.getAttribute('href');
		if (element.getAttribute('rel') === 'stylesheet' && href) {
			const res = await fetch(new URL(href, this.baseUrl), {
				cf: {
					cacheEverything: true,
					cacheTtl: 3600,
				},
			});
			const css = await res.text();
			element.replace(`<style>${css}</style>`, { html: true });
		}
	}
}

class ImageLoaderScript implements HTMLRewriterElementContentHandlers {
	static selector = 'body';
	element(element: Element) {
		element.append(`<script>${imageLoaderScript}</script>`, { html: true });
	}
}
