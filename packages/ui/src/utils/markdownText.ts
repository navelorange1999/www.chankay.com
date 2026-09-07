import { marked, type MarkedOptions, type Token, type Tokens } from "marked"

export const MARKDOWN_OPTIONS = {
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

const extractTokens = (tokens: readonly Token[]): string =>
	tokens.map(extractToken).filter(Boolean).join(" ")

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
		case "text": {
			const childTokens = getChildTokens(token as Token)
			return childTokens ? extractTokens(childTokens) : getTokenText(token as Token)
		}
		case "link":
		case "em":
		case "strong":
		case "del":
		case "blockquote":
		case "heading":
		case "paragraph":
		case "list_item": {
			const childTokens = getChildTokens(token as Token)
			return childTokens ? extractTokens(childTokens) : getTokenText(token as Token)
		}
		case "list": {
			const items = isRecord(token) && Array.isArray(token.items) ? token.items : []
			return extractTokens(items as Token[])
		}
		case "table": {
			const table = token as unknown as Tokens.Table
			const cells = [...table.header, ...table.rows.flat()]

			return cells
				.map((cell) => extractTokens(cell.tokens))
				.filter(Boolean)
				.join(" ")
		}
		case "br":
			return " "
		case "checkbox":
			return ""
		default: {
			const childTokens = getChildTokens(token as Token)
			return childTokens ? extractTokens(childTokens) : getTokenText(token as Token)
		}
	}
}

export function extractMarkdownText(content: string): string {
	if (!content.trim()) return ""

	return extractTokens(marked.lexer(content, MARKDOWN_OPTIONS))
}
