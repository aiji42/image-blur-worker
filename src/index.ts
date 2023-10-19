export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url)
		const src = url.searchParams.get('src')
		if (!src) return new Response(null, { status: 404 })

		return fetch(src, {
			cf: {
				image: {
					fit: "scale-down",
					width: 250,
					height: 500,
					quality: 50,
					blur: 150,
					format : 'webp'
				},
				cacheEverything: true,
				cacheTtl: 3600,
			}
		})
	},
};
