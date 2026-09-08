import { marked } from "marked"
import { z } from "zod"

const documentSchema = z.object({ content: z.string().max(100000) })
const uploadSchema = z.object({ doc: z.object({ id: z.string().regex(/^[a-zA-Z0-9_-]{1,128}$/) }) })

export async function prepareDiagramAssets(
	postId: string,
	locale: string,
	render: (definition: string) => Promise<Blob>,
	fetcher: typeof fetch = fetch,
	cache = new Map<string, string>()
) {
	const query = new URLSearchParams({
		locale,
		"fallback-locale": "none",
		draft: "false",
		depth: "0",
	})
	const response = await fetcher(`/api/posts/${encodeURIComponent(postId)}?${query}`)
	if (!response.ok) throw new Error("Unable to read published article.")
	const { content } = documentSchema.parse(await response.json())
	const definitions = new Set<string>()
	marked.walkTokens(marked.lexer(content), (token) => {
		if (token.type === "code" && token.lang?.split(/\s+/)[0] === "mermaid")
			definitions.add(token.text)
	})
	if (definitions.size > 7 || [...definitions].some((definition) => definition.length > 10000))
		throw new Error("The article exceeds diagram limits.")
	const result: Array<{ definition: string; mediaId: string }> = []
	for (const definition of definitions) {
		let mediaId = cache.get(definition)
		if (!mediaId) {
			const image = await render(definition)
			if (image.type !== "image/png" || image.size > 1000000 || !image.size)
				throw new Error("Diagram must be a PNG smaller than 1 MB.")
			const form = new FormData()
			form.append("_payload", JSON.stringify({ alt: `Article diagram ${result.length + 1}` }))
			form.append("file", image, `article-diagram-${result.length + 1}.png`)
			const uploaded = await fetcher("/api/media", { method: "POST", body: form })
			if (!uploaded.ok) throw new Error("Unable to upload article diagram.")
			mediaId = uploadSchema.parse(await uploaded.json()).doc.id
			cache.set(definition, mediaId)
		}
		result.push({ definition, mediaId })
	}
	return result
}
