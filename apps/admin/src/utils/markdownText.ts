import { marked, type MarkedOptions, type Token, type Tokens } from "marked"

const MARKDOWN_OPTIONS = {
	breaks: false,
	gfm: true,
} satisfies Pick<MarkedOptions, "breaks" | "gfm">

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null

const getChildTokens = (token: Token): Token[] | null => {
	if (!isRecord(token) || !Array.isArray(token.tokens)) return null

	return token.tokens as Token[]
}

const getTokenText = (token: Token): string =>
	isRecord(token) && typeof token.text === "string" ? token.text : ""

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
