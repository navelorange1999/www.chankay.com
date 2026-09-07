import { marked, type MarkedOptions, type Token, type Tokens } from "marked"

const MARKDOWN_OPTIONS = {
	breaks: false,
	gfm: true,
} satisfies Pick<MarkedOptions, "breaks" | "gfm">

const NON_VISIBLE_HTML_TAGS = new Set(["script", "style", "template"])

const NAMED_HTML_ENTITIES: Record<string, string> = {
	amp: "&",
	apos: "'",
	gt: ">",
	lt: "<",
	nbsp: " ",
	quot: '"',
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null

function isValidCodePoint(value: number): boolean {
	return value >= 0 && value <= 0x10ffff && !(value >= 0xd800 && value <= 0xdfff)
}

function decodeHtmlEntities(value: string): string {
	return value.replace(/&(#(?:[xX][0-9a-fA-F]+|[0-9]+)|[a-zA-Z]+);/g, (match, entity: string) => {
		const normalizedEntity = entity.toLowerCase()

		if (normalizedEntity.startsWith("#x")) {
			const codePoint = Number.parseInt(normalizedEntity.slice(2), 16)
			return isValidCodePoint(codePoint) ? String.fromCodePoint(codePoint) : match
		}

		if (normalizedEntity.startsWith("#")) {
			const codePoint = Number.parseInt(normalizedEntity.slice(1), 10)
			return isValidCodePoint(codePoint) ? String.fromCodePoint(codePoint) : match
		}

		return NAMED_HTML_ENTITIES[normalizedEntity] ?? match
	})
}

interface HtmlTag {
	end: number
	name: string | null
	closing: boolean
	selfClosing: boolean
}

function readHtmlTag(value: string, start: number): HtmlTag | null {
	if (value[start] !== "<") return null

	let quote: "'" | '"' | null = null
	for (let index = start + 1; index < value.length; index += 1) {
		const character = value[index]

		if (quote) {
			if (character === quote) quote = null
			continue
		}

		if (character === '"' || character === "'") {
			quote = character
			continue
		}

		if (character !== ">") continue

		const source = value.slice(start + 1, index)
		const match = source.match(/^\s*(\/)?\s*([A-Za-z][\w:-]*)\b([\s\S]*)$/)

		if (!match) {
			return /^\s*[!?]/.test(source)
				? { closing: false, end: index, name: null, selfClosing: true }
				: null
		}
		const tagName = match[2]
		if (!tagName) return null

		return {
			closing: Boolean(match[1]),
			end: index,
			name: tagName.toLowerCase(),
			selfClosing: /\/\s*$/.test(match[3] ?? ""),
		}
	}

	return null
}

function skipNonVisibleElement(value: string, openingTag: HtmlTag): number {
	if (!openingTag.name) return openingTag.end + 1

	let depth = 1
	let cursor = openingTag.end + 1

	while (cursor < value.length) {
		const nextTagStart = value.indexOf("<", cursor)
		if (nextTagStart === -1) return value.length

		if (value.startsWith("<!--", nextTagStart)) {
			const commentEnd = value.indexOf("-->", nextTagStart + 4)
			cursor = commentEnd === -1 ? value.length : commentEnd + 3
			continue
		}

		const tag = readHtmlTag(value, nextTagStart)
		if (!tag) {
			cursor = nextTagStart + 1
			continue
		}

		if (tag.name === openingTag.name) {
			if (tag.closing) depth -= 1
			else if (!tag.selfClosing) depth += 1

			if (depth === 0) return tag.end + 1
		}

		cursor = tag.end + 1
	}

	return value.length
}

function extractHtmlText(value: string): string {
	const visibleCharacters: string[] = []
	let cursor = 0

	while (cursor < value.length) {
		const character = value[cursor]
		if (character === undefined) break

		if (value.startsWith("<!--", cursor)) {
			const commentEnd = value.indexOf("-->", cursor + 4)
			cursor = commentEnd === -1 ? value.length : commentEnd + 3
			continue
		}

		if (character !== "<") {
			visibleCharacters.push(character)
			cursor += 1
			continue
		}

		const tag = readHtmlTag(value, cursor)
		if (!tag) {
			visibleCharacters.push(character)
			cursor += 1
			continue
		}

		if (tag.name && !tag.closing && NON_VISIBLE_HTML_TAGS.has(tag.name) && !tag.selfClosing) {
			cursor = skipNonVisibleElement(value, tag)
		} else {
			cursor = tag.end + 1
		}
	}

	return decodeHtmlEntities(visibleCharacters.join(""))
}

const getChildTokens = (token: Token): Token[] | null => {
	if (!isRecord(token) || !Array.isArray(token.tokens)) return null

	return token.tokens as Token[]
}

const getTokenText = (token: Token): string =>
	isRecord(token) && typeof token.text === "string" ? decodeHtmlEntities(token.text) : ""

const joinTokens = (tokens: readonly Token[], separator: string): string =>
	tokens.map(extractToken).filter(Boolean).join(separator)

const extractInlineTokens = (tokens: readonly Token[]): string => joinTokens(tokens, "")

const extractBlockTokens = (tokens: readonly Token[]): string => joinTokens(tokens, " ")

const extractChildren = (token: Token, mode: "inline" | "block"): string => {
	const childTokens = getChildTokens(token)
	if (!childTokens) return getTokenText(token)

	return mode === "inline" ? extractInlineTokens(childTokens) : extractBlockTokens(childTokens)
}

function extractToken(token: Token): string {
	if (!isRecord(token) || typeof token.type !== "string") return ""

	switch (token.type) {
		case "code":
		case "codespan":
		case "def":
		case "hr":
		case "image":
		case "space":
			return ""
		case "html":
			return isRecord(token) && typeof token.text === "string" ? extractHtmlText(token.text) : ""
		case "escape":
		case "text":
			return extractChildren(token, "inline")
		case "link":
		case "em":
		case "strong":
		case "del":
		case "heading":
		case "paragraph":
			return extractChildren(token, "inline")
		case "blockquote":
		case "list_item":
			return extractChildren(token, "block")
		case "list": {
			const items = isRecord(token) && Array.isArray(token.items) ? token.items : []
			return extractBlockTokens(items as Token[])
		}
		case "table": {
			const table = token as unknown as Tokens.Table
			const cells = [...table.header, ...table.rows.flat()]

			return cells
				.map((cell) => extractInlineTokens(cell.tokens))
				.filter(Boolean)
				.join(" ")
		}
		case "br":
			return " "
		case "checkbox":
			return ""
		default:
			return extractChildren(token, "inline")
	}
}

export function extractMarkdownText(content: string): string {
	if (!content.trim()) return ""

	return extractBlockTokens(marked.lexer(content, MARKDOWN_OPTIONS))
}
