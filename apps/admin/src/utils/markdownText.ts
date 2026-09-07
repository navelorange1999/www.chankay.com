import { Parser } from "htmlparser2"
import { marked, type MarkedOptions } from "marked"

const MARKDOWN_OPTIONS = {
	async: false,
	breaks: false,
	gfm: true,
} satisfies Pick<MarkedOptions, "async" | "breaks" | "gfm">

const HIDDEN_TAGS = new Set(["code", "pre", "script", "style", "template"])

const BLOCK_TAGS = new Set([
	"address",
	"article",
	"aside",
	"blockquote",
	"br",
	"caption",
	"dd",
	"details",
	"div",
	"dl",
	"dt",
	"fieldset",
	"figcaption",
	"figure",
	"footer",
	"form",
	"h1",
	"h2",
	"h3",
	"h4",
	"h5",
	"h6",
	"header",
	"hr",
	"li",
	"main",
	"nav",
	"ol",
	"p",
	"section",
	"summary",
	"table",
	"tbody",
	"td",
	"tfoot",
	"th",
	"thead",
	"tr",
	"ul",
])

const readingTimeRenderer = new marked.Renderer()
readingTimeRenderer.code = () => ""
readingTimeRenderer.codespan = () => ""
readingTimeRenderer.image = () => ""

function extractVisibleHtmlText(html: string): string {
	const text: string[] = []
	let hiddenDepth = 0

	const parser = new Parser(
		{
			onclosetag(name) {
				if (HIDDEN_TAGS.has(name)) {
					hiddenDepth = Math.max(0, hiddenDepth - 1)
					if (name === "pre" && hiddenDepth === 0) text.push(" ")
					return
				}

				if (hiddenDepth === 0 && BLOCK_TAGS.has(name)) text.push(" ")
			},
			onopentag(name) {
				if (HIDDEN_TAGS.has(name)) {
					if (name === "pre" && hiddenDepth === 0) text.push(" ")
					hiddenDepth += 1
					return
				}

				if (hiddenDepth === 0 && BLOCK_TAGS.has(name)) text.push(" ")
			},
			ontext(value) {
				if (hiddenDepth === 0) text.push(value)
			},
		},
		{ decodeEntities: true }
	)

	parser.end(html)

	return text.join("")
}

export function extractMarkdownText(content: string): string {
	if (!content.trim()) return ""

	const renderedHtml = marked.parse(content, {
		...MARKDOWN_OPTIONS,
		renderer: readingTimeRenderer,
	}) as string

	return extractVisibleHtmlText(renderedHtml)
}
