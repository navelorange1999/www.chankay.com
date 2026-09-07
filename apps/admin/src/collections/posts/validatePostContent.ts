import { validations, type TextareaFieldValidation } from "payload"
import { createMarkdownDocument } from "@repo/ui/components/Markdown"

export const POST_CONTENT_H1_ERROR =
	"The post title is managed by the Title field. Start body sections with ## instead of using an H1."

export function validatePostMarkdownBody(value: unknown): true | string {
	if (typeof value !== "string" || value.length === 0) return true

	const document = createMarkdownDocument(value)
	return document.headings.some((heading) => heading.level === 1) ||
		/<h1(?:\s|>)/i.test(document.html)
		? POST_CONTENT_H1_ERROR
		: true
}

export const validatePostContent: TextareaFieldValidation = (value, options) => {
	const builtInResult = validations.textarea(value, options)
	if (builtInResult !== true) return builtInResult
	return validatePostMarkdownBody(value)
}
