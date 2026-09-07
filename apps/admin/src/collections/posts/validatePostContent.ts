import { validations, type TextareaFieldValidation } from "payload"

export const POST_CONTENT_H1_ERROR =
	"The post title is managed by the Title field. Start body sections with ## instead of using an H1."

type Fence = { character: "`" | "~"; length: number }

function getFence(line: string): Fence | null {
	const match = line.match(/^ {0,3}([`~]{3,})/)
	const marker = match?.[1]
	if (!marker || (marker.includes("`") && marker.includes("~"))) return null
	return { character: marker[0] as Fence["character"], length: marker.length }
}

function closesFence(line: string, fence: Fence): boolean {
	const match = line.match(/^ {0,3}([`~]+)[ \t]*$/)
	const marker = match?.[1]
	return Boolean(marker && marker[0] === fence.character && marker.length >= fence.length)
}

export function validatePostMarkdownBody(value: unknown): true | string {
	if (typeof value !== "string" || value.length === 0) return true

	let fence: Fence | null = null
	let previousLine: string | null = null
	for (const line of value.split(/\r?\n/)) {
		if (fence) {
			if (closesFence(line, fence)) fence = null
			continue
		}

		const openingFence = getFence(line)
		if (openingFence) {
			fence = openingFence
			previousLine = null
			continue
		}

		if (/^ {0,3}#(?:[ \t]|$)/.test(line)) return POST_CONTENT_H1_ERROR
		if (/<h1(?:[ \t>])/i.test(line)) return POST_CONTENT_H1_ERROR
		if (previousLine !== null && previousLine.trim() !== "" && /^ {0,3}=+[ \t]*$/.test(line)) {
			return POST_CONTENT_H1_ERROR
		}

		previousLine = line
	}

	return true
}

export const validatePostContent: TextareaFieldValidation = (value, options) => {
	const builtInResult = validations.textarea(value, options)
	if (builtInResult !== true) return builtInResult
	return validatePostMarkdownBody(value)
}
