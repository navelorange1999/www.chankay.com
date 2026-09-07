const HAN_CHARACTERS_PER_MINUTE = 400
const WORDS_PER_MINUTE = 200

const normalizeMarkdown = (markdown: string): string =>
	markdown
		.replace(/^[ \t]{0,3}([`~])\1{2,}[^\n]*(?:\n|$)[\s\S]*?^[ \t]{0,3}\1{3,}[ \t]*$/gm, " ")
		.replace(/(`+)([\s\S]*?)\1/g, " ")
		.replace(/^[ \t]{0,3}\[[^\]\n]+\]:[^\n]*(?:\n|$)/gm, " ")
		.replace(/!\[[^\]\n]*\]\([^\)\n]*\)/g, " ")
		.replace(/!\[[^\]\n]*\]\[[^\]\n]*\]/g, " ")
		.replace(/!\[[^\]\n]*\]/g, " ")
		.replace(/\[([^\]\n]+)\]\([^\)\n]*\)/g, "$1")
		.replace(/\[([^\]\n]+)\]\[[^\]\n]*\]/g, "$1")
		.replace(/^>\s+/gm, " ")
		.replace(/^#{1,6}\s+/gm, " ")
		.replace(/[*_~#>-]/g, " ")

export const estimateReadingTimeFromMarkdown = (value: unknown): number => {
	if (typeof value !== "string" || !value.trim()) {
		return 0
	}

	const plainText = normalizeMarkdown(value)
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
