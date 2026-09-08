import { marked, Renderer } from "marked"
import { Parser } from "htmlparser2"
import { z } from "zod"
import {
	SocialPublishingError,
	type PublicationSourceSnapshot,
	type PreparedPlatformPayload,
} from "../../types"

export const WECHAT_ADAPTER_VERSION = "wechat-v2"
// Conservative application limits; production account limits remain an operational verification gate.
export const WECHAT_LIMITS = {
	title: 64,
	summary: 120,
	author: 8,
	htmlBytes: 20000,
	inlineImageBytes: 1000000,
	coverBytes: 10000000,
	images: 20,
} as const
const tags = new Set([
	"table",
	"thead",
	"tbody",
	"tr",
	"th",
	"td",
	"p",
	"h1",
	"h2",
	"h3",
	"h4",
	"h5",
	"h6",
	"strong",
	"em",
	"del",
	"blockquote",
	"ul",
	"ol",
	"li",
	"pre",
	"code",
	"br",
	"hr",
	"a",
	"img",
])
const escape = (text: string) =>
	text
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
export function safeWebUrl(value: string): boolean {
	try {
		const url = new URL(value)
		return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password
	} catch {
		return false
	}
}
const webUrl = z.string().max(2048).refine(safeWebUrl)
const id = z.string().min(1).max(256)
const settings = z
	.object({
		author: z.string().max(WECHAT_LIMITS.author),
		openComments: z.boolean(),
		onlyFansCanComment: z.boolean(),
	})
	.strict()
const preparedSchema = z
	.object({
		platform: z.literal("wechat-official-account"),
		adapterVersion: z.literal(WECHAT_ADAPTER_VERSION),
		title: z.string().trim().min(1).max(WECHAT_LIMITS.title),
		summary: z.string().max(WECHAT_LIMITS.summary),
		html: z
			.string()
			.min(1)
			.refine((value) => Buffer.byteLength(value, "utf8") <= WECHAT_LIMITS.htmlBytes),
		coverMediaId: id,
		images: z.array(z.object({ id, url: webUrl }).strict()).max(WECHAT_LIMITS.images),
		canonicalUrl: webUrl,
		settings,
		warnings: z.array(z.string().max(200)).max(20),
	})
	.strict()

export function reconstructHtml(
	html: string,
	images: Array<{ id: string; url: string }>,
	replacements?: Record<string, string>
): string {
	let output = ""
	const parser = new Parser(
		{
			onopentag(name, attrs) {
				if (!tags.has(name)) throw new SocialPublishingError("prepare")
				const allowed =
					name === "img"
						? ["src", "alt", "title"]
						: name === "a"
							? ["href", "title"]
							: name === "code"
								? ["class"]
								: name === "th" || name === "td"
									? ["align"]
									: name === "ol"
										? ["start"]
										: []
				if (Object.keys(attrs).some((attr) => !allowed.includes(attr)))
					throw new SocialPublishingError("prepare")
				let attributes = ""
				if (name === "a") {
					if (!safeWebUrl(attrs.href ?? "")) throw new SocialPublishingError("prepare")
					attributes = ` href="${escape(attrs.href!)}"`
				}
				if (name === "img") {
					const media = images.find((image) => image.url === attrs.src)
					if (!media) throw new SocialPublishingError("prepare")
					const url = replacements?.[media.id] ?? media.url
					if (!safeWebUrl(url)) throw new SocialPublishingError("prepare")
					attributes = ` src="${escape(url)}" alt="${escape(attrs.alt ?? "")}"`
				}
				output += `<${name}${attributes}>`
			},
			ontext(value) {
				output += escape(value)
			},
			onclosetag(name) {
				if (name !== "img" && name !== "br" && name !== "hr") output += `</${name}>`
			},
			oncomment() {
				throw new SocialPublishingError("prepare")
			},
			onprocessinginstruction() {
				throw new SocialPublishingError("prepare")
			},
		},
		{ decodeEntities: true }
	)
	parser.write(html)
	parser.end()
	return output
}
export function validateWeChatPrepared(value: unknown): PreparedPlatformPayload {
	const result = preparedSchema.safeParse(value)
	if (!result.success) throw new SocialPublishingError("prepare")
	const prepared = result.data
	if (
		new Set(prepared.images.map((image) => image.id)).size !== prepared.images.length ||
		new Set(prepared.images.map((image) => image.url)).size !== prepared.images.length
	)
		throw new SocialPublishingError("prepare")
	if (reconstructHtml(prepared.html, prepared.images) !== prepared.html)
		throw new SocialPublishingError("prepare")
	return prepared
}
export async function renderWeChat(
	source: PublicationSourceSnapshot
): Promise<PreparedPlatformPayload> {
	if (
		source.adapterVersion !== WECHAT_ADAPTER_VERSION ||
		!source.media.some((media) => media.id === source.coverMediaId) ||
		source.markdown.length > 200000
	)
		throw new SocialPublishingError("prepare")
	const tokens = marked.lexer(source.markdown, { gfm: true })
	const images: Array<{ id: string; url: string }> = []
	const mappings = source.assets?.diagramImages ?? []
	if (new Set(mappings.map((entry) => entry.definition)).size !== mappings.length)
		throw new SocialPublishingError("prepare", "DIAGRAM_STALE")
	const used = new Set<string>()
	const diagramUrls = new Map<string, string>()
	marked.walkTokens(tokens, (token) => {
		if (token.type === "html") throw new SocialPublishingError("prepare")
		if (token.type === "code" && token.lang?.split(/\s+/)[0] === "mermaid") {
			const mapping = mappings.find((entry) => entry.definition === token.text)
			const media = source.media.find((entry) => entry.id === mapping?.mediaId)
			if (!mapping || !media || !["image/jpeg", "image/png"].includes(media.mimeType))
				throw new SocialPublishingError("prepare", "DIAGRAM_REQUIRED")
			used.add(mapping.definition)
			diagramUrls.set(mapping.definition, media.url)
			if (!images.some((entry) => entry.id === media.id))
				images.push({ id: media.id, url: media.url })
		}
		if (token.type === "image") {
			const media = source.media.find((media) => media.url === token.href)
			if (!media || !safeWebUrl(media.url) || !["image/jpeg", "image/png"].includes(media.mimeType))
				throw new SocialPublishingError("prepare")
			if (!images.some((image) => image.id === media.id))
				images.push({ id: media.id, url: media.url })
		}
	})
	if (used.size !== mappings.length) throw new SocialPublishingError("prepare", "DIAGRAM_STALE")
	const renderer = new Renderer()
	const defaultCode = renderer.code.bind(renderer)
	renderer.code = (token) =>
		diagramUrls.has(token.text) && token.lang?.split(/\s+/)[0] === "mermaid"
			? `<p><img src="${escape(diagramUrls.get(token.text)!)}" alt="Article diagram"></p>`
			: defaultCode(token)
	const html = reconstructHtml(marked.parser(tokens, { renderer }), images)
	return validateWeChatPrepared({
		platform: source.platform,
		adapterVersion: source.adapterVersion,
		title: source.title,
		summary: source.excerpt,
		html,
		coverMediaId: source.coverMediaId,
		images,
		canonicalUrl: source.canonicalUrl,
		settings: source.settings,
		warnings: [],
	})
}
