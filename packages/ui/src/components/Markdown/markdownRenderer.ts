import hljs from "highlight.js/lib/core"
import bash from "highlight.js/lib/languages/bash"
import css from "highlight.js/lib/languages/css"
import diff from "highlight.js/lib/languages/diff"
import javascript from "highlight.js/lib/languages/javascript"
import json from "highlight.js/lib/languages/json"
import markdown from "highlight.js/lib/languages/markdown"
import scss from "highlight.js/lib/languages/scss"
import sql from "highlight.js/lib/languages/sql"
import typescript from "highlight.js/lib/languages/typescript"
import xml from "highlight.js/lib/languages/xml"
import yaml from "highlight.js/lib/languages/yaml"
import { marked } from "marked"

export interface MarkdownHeading {
	id: string
	level: number
	text: string
}

export interface MarkdownDocument {
	hasMermaid: boolean
	headings: MarkdownHeading[]
	html: string
}

const renderer = new marked.Renderer()
const headingTagPattern = /<h([1-6])>([\s\S]*?)<\/h\1>/g

const highlightLanguages = {
	bash,
	css,
	diff,
	javascript,
	json,
	markdown,
	scss,
	sql,
	typescript,
	xml,
	yaml,
} as const

type HighlightLanguage = keyof typeof highlightLanguages

const highlightLanguageAliases: Record<string, HighlightLanguage> = {
	cjs: "javascript",
	htm: "xml",
	html: "xml",
	js: "javascript",
	jsonc: "json",
	jsx: "javascript",
	md: "markdown",
	mjs: "javascript",
	sh: "bash",
	shell: "bash",
	svg: "xml",
	ts: "typescript",
	tsx: "typescript",
	yml: "yaml",
	zsh: "bash",
}

const registeredHighlightLanguages = Object.keys(highlightLanguages) as HighlightLanguage[]

Object.entries(highlightLanguages).forEach(([name, language]) => {
	hljs.registerLanguage(name, language)
})

function resolveHighlightLanguage(value: string): HighlightLanguage | null {
	const normalized = highlightLanguageAliases[value] ?? value

	return registeredHighlightLanguages.includes(normalized as HighlightLanguage)
		? (normalized as HighlightLanguage)
		: null
}

function escapeHtml(value: string): string {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;")
}

renderer.code = ({ text, lang }) => {
	const language = typeof lang === "string" ? lang.trim().toLowerCase() : ""

	if (language === "mermaid") {
		return `<div class="not-prose my-6 overflow-x-auto rounded-lg border border-border bg-muted/30 p-4"><div data-mermaid-definition="${encodeURIComponent(text)}"></div></div>`
	}

	const resolvedLanguage = language ? resolveHighlightLanguage(language) : null

	if (language && !resolvedLanguage) {
		return `<pre><code class="hljs language-plaintext">${escapeHtml(text)}</code></pre>`
	}

	const result = resolvedLanguage
		? hljs.highlight(text, { language: resolvedLanguage, ignoreIllegals: true })
		: hljs.highlightAuto(text, registeredHighlightLanguages)

	const languageClass = result.language ? ` language-${result.language}` : ""

	return `<pre><code class="hljs${languageClass}">${result.value}</code></pre>`
}

function decodeHtmlEntities(value: string): string {
	return value.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (_, entity: string) => {
		const normalizedEntity = entity.toLowerCase()

		if (normalizedEntity.startsWith("#x")) {
			return String.fromCodePoint(parseInt(normalizedEntity.slice(2), 16))
		}

		if (normalizedEntity.startsWith("#")) {
			return String.fromCodePoint(parseInt(normalizedEntity.slice(1), 10))
		}

		const namedEntities: Record<string, string> = {
			amp: "&",
			apos: "'",
			gt: ">",
			lt: "<",
			nbsp: " ",
			quot: '"',
		}

		return namedEntities[normalizedEntity] ?? _
	})
}

function stripHtmlTags(value: string): string {
	return decodeHtmlEntities(value.replace(/<[^>]+>/g, " "))
		.replace(/\s+/g, " ")
		.trim()
}

function slugifyHeading(text: string): string {
	const normalized = text
		.toLowerCase()
		.normalize("NFKD")
		.replace(/[^\p{Letter}\p{Number}\s-]/gu, "")
		.trim()
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-")

	return normalized || "section"
}

function createUniqueHeadingId(text: string, seenCounts: Map<string, number>): string {
	const baseId = slugifyHeading(text)
	const currentCount = seenCounts.get(baseId) ?? 0
	seenCounts.set(baseId, currentCount + 1)

	return currentCount === 0 ? baseId : `${baseId}-${currentCount + 1}`
}

function injectHeadingIds(html: string): Pick<MarkdownDocument, "headings" | "html"> {
	const seenCounts = new Map<string, number>()
	const headings: MarkdownHeading[] = []

	const enhancedHtml = html.replace(
		headingTagPattern,
		(fullMatch, levelValue: string, innerHtml: string) => {
			const text = stripHtmlTags(innerHtml)

			if (!text) {
				return fullMatch
			}

			const level = Number(levelValue)
			const id = createUniqueHeadingId(text, seenCounts)
			headings.push({ id, level, text })

			return `<h${level} id="${id}">${innerHtml}</h${level}>`
		}
	)

	return {
		headings,
		html: enhancedHtml,
	}
}

export function createMarkdownDocument(content: string): MarkdownDocument {
	if (!content.trim()) {
		return {
			hasMermaid: false,
			headings: [],
			html: "",
		}
	}

	const rawHtml = marked.parse(content, {
		async: false,
		gfm: true,
		breaks: false,
		renderer,
	}) as string

	const { html, headings } = injectHeadingIds(rawHtml)

	return {
		hasMermaid: hasMermaidDiagrams(html),
		headings,
		html,
	}
}

export function createMarkdownHtml(content: string): string {
	return createMarkdownDocument(content).html
}

export function hasMermaidDiagrams(html: string): boolean {
	return html.includes("data-mermaid-definition=")
}
