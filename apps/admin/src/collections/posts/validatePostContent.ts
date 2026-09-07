import { validations, type TextareaFieldValidation } from "payload"
import { createMarkdownDocument } from "@repo/ui/components/Markdown"

export const POST_CONTENT_H1_ERROR =
	"The post title is managed by the Title field. Start body sections with ## instead of using an H1."
export const POST_CONTENT_PARSE_ERROR =
	"Unable to parse the post body. Fix invalid Markdown or HTML entities and try again."

function containsH1Element(html: string): boolean {
	let cursor = 0

	while (cursor < html.length) {
		const tagStart = html.indexOf("<", cursor)
		if (tagStart === -1) return false

		if (html.startsWith("<!--", tagStart)) {
			const commentEnd = html.indexOf("-->", tagStart + 4)
			if (commentEnd === -1) return false
			cursor = commentEnd + 3
			continue
		}

		const tagLead = html[tagStart + 1]
		const isTagOpening =
			tagLead === "/" ||
			tagLead === "!" ||
			tagLead === "?" ||
			(typeof tagLead === "string" && /[A-Za-z]/.test(tagLead))

		if (!isTagOpening) {
			cursor = tagStart + 1
			continue
		}

		let quote: '"' | "'" | null = null
		let tagEnd = tagStart + 1

		for (; tagEnd < html.length; tagEnd += 1) {
			const character = html[tagEnd]

			if (quote) {
				if (character === quote) quote = null
				continue
			}

			if (character === '"' || character === "'") {
				quote = character
				continue
			}

			if (character === ">") break
		}

		if (tagEnd === html.length) return false

		const tag = html.slice(tagStart, tagEnd + 1)
		if (/^<h1(?:\s|\/?>)/i.test(tag)) return true

		cursor = tagEnd + 1
	}

	return false
}

export function validatePostMarkdownBody(value: unknown): true | string {
	if (typeof value !== "string" || value.length === 0) return true

	try {
		const document = createMarkdownDocument(value)
		return containsH1Element(document.html) ? POST_CONTENT_H1_ERROR : true
	} catch {
		return POST_CONTENT_PARSE_ERROR
	}
}

export const validatePostContent: TextareaFieldValidation = (value, options) => {
	const builtInResult = validations.textarea(value, options)
	if (builtInResult !== true) return builtInResult
	return validatePostMarkdownBody(value)
}
