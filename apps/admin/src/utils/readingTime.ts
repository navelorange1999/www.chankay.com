import { extractMarkdownText } from "./markdownText"

const HAN_CHARACTERS_PER_MINUTE = 400
const WORDS_PER_MINUTE = 200

export const estimateReadingTimeFromMarkdown = (value: unknown): number => {
	if (typeof value !== "string" || !value.trim()) {
		return 0
	}

	const plainText = extractMarkdownText(value)
	const hanCharacterCount = plainText.match(/\p{Script=Han}/gu)?.length ?? 0
	const nonHanText = plainText.replace(/\p{Script=Han}/gu, " ")
	const wordCount = nonHanText
		.split(/\s+/)
		.map((word) => word.trim())
		.filter((word) => /[\p{L}\p{N}]/u.test(word)).length
	const readingMinutes =
		hanCharacterCount / HAN_CHARACTERS_PER_MINUTE + wordCount / WORDS_PER_MINUTE

	return readingMinutes > 0 ? Math.ceil(readingMinutes) : 0
}
