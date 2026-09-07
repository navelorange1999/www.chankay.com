import { validations, type TextareaFieldValidation } from "payload"
import { createMarkdownDocument } from "@repo/ui/components/Markdown"

export const POST_CONTENT_H1_ERROR =
	"The post title is managed by the Title field. Start body sections with ## instead of using an H1."
export const POST_CONTENT_PARSE_ERROR =
	"Unable to parse the post body. Fix invalid Markdown or HTML entities and try again."

export function validatePostMarkdownBody(value: unknown): true | string {
	if (typeof value !== "string" || value.length === 0) return true

	try {
		const document = createMarkdownDocument(value)
		const renderedHtml = document.html.replace(/<!--[\s\S]*?-->/g, "")
		return /<h1(?:\s|>|\/>)/i.test(renderedHtml) ? POST_CONTENT_H1_ERROR : true
	} catch {
		return POST_CONTENT_PARSE_ERROR
	}
}

export const validatePostContent: TextareaFieldValidation = (value, options) => {
	const builtInResult = validations.textarea(value, options)
	if (builtInResult !== true) return builtInResult
	return validatePostMarkdownBody(value)
}
