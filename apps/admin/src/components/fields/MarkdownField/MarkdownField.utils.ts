import type { MarkdownFieldCustom } from "./MarkdownField.types"

export function getString(value: unknown): string {
	return typeof value === "string" ? value : ""
}

export function normalizeLabel(value: string): string {
	return value.replace(/\]/g, "\\]")
}

export function deriveAltFromFilename(filename: string): string {
	const baseName = filename.replace(/\.[^/.]+$/, "")
	return baseName.replace(/[-_]+/g, " ").trim()
}

export async function getErrorMessageFromResponse(
	response: Response,
	fallbackMessage: string
): Promise<string> {
	try {
		const result = (await response.json()) as {
			errors?: Array<{ message?: string }>
			message?: string
		}

		if (Array.isArray(result.errors) && typeof result.errors[0]?.message === "string") {
			return result.errors[0].message
		}

		if (typeof result.message === "string" && result.message.trim()) {
			return result.message
		}
	} catch {
		// Ignore response parsing failures and use the fallback message instead.
	}

	return fallbackMessage
}

export function getMarkdownFieldCustom(
	field: { custom?: MarkdownFieldCustom } | Record<string, unknown>
): MarkdownFieldCustom {
	return (field as { custom?: MarkdownFieldCustom }).custom || {}
}
