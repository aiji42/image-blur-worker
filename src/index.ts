export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);
		const src = url.searchParams.get('src');
		const blur = url.searchParams.get('blur');
		const minimize = url.searchParams.get('minimize');
		const polish = url.searchParams.get('polish');
		if (!src) return new Response(null, { status: 404 });

		return fetch(src, {
			cf: {
				image: {
					blur: blur ? 250 : 0,
					...(minimize
						? {
								fit: 'scale-down',
								width: 200,
								height: 200,
						  }
						: {}),
					...(polish
						? {
								format: 'webp',
								quality: 60,
						  }
						: {}),
				},
				cacheEverything: true,
				cacheTtl: 3600,
			},
		});
	},
};
