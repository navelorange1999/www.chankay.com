const HAN_CHARACTERS_PER_MINUTE = 400
const WORDS_PER_MINUTE = 200

type Fence = {
	character: "`" | "~"
	length: number
}

type BacktickRun = {
	end: number
	length: number
	start: number
}

const readFence = (line: string): (Fence & { trailing: string }) | null => {
	const match = line.match(/^[ \t]{0,3}(`{3,}|~{3,})(.*)$/)
	if (!match) return null
	const marker = match[1]
	if (!marker) return null

	return {
		character: marker[0] as Fence["character"],
		length: marker.length,
		trailing: match[2] ?? "",
	}
}

const stripFencedCode = (markdown: string): string => {
	const lines = markdown.split("\n")
	const normalizedLines: string[] = []
	let activeFence: Fence | null = null

	for (const line of lines) {
		const fence = readFence(line)

		if (activeFence) {
			const isClosingFence =
				fence &&
				fence.character === activeFence.character &&
				fence.length >= activeFence.length &&
				/^[ \t]*\r?$/.test(fence.trailing)
			if (isClosingFence) activeFence = null
			normalizedLines.push("")
			continue
		}

		if (fence) {
			activeFence = fence
			normalizedLines.push("")
			continue
		}

		normalizedLines.push(line)
	}

	return normalizedLines.join("\n")
}

const findBacktickRun = (markdown: string, from: number): BacktickRun | null => {
	const start = markdown.indexOf("`", from)
	if (start < 0) return null

	let end = start + 1
	while (end < markdown.length && markdown[end] === "`") end += 1

	return { end, length: end - start, start }
}

const stripInlineCode = (markdown: string): string => {
	let cursor = 0
	let normalized = ""

	while (cursor < markdown.length) {
		const openingRun = findBacktickRun(markdown, cursor)
		if (!openingRun) {
			normalized += markdown.slice(cursor)
			break
		}

		normalized += markdown.slice(cursor, openingRun.start)

		let searchFrom = openingRun.end
		let closingRun: BacktickRun | null = null
		while (searchFrom < markdown.length) {
			const candidate = findBacktickRun(markdown, searchFrom)
			if (!candidate) break
			if (candidate.length === openingRun.length) {
				closingRun = candidate
				break
			}
			searchFrom = candidate.end
		}

		if (!closingRun) {
			normalized += markdown.slice(openingRun.start, openingRun.end)
			cursor = openingRun.end
			continue
		}

		normalized += " "
		cursor = closingRun.end
	}

	return normalized
}

const normalizeMarkdown = (markdown: string): string =>
	stripInlineCode(stripFencedCode(markdown))
		.replace(/^[ \t]{0,3}\[[^\]\n]+\]:[^\n]*(?:\n|$)/gm, " ")
		.replace(/!\[[^\]\n]*\]\([^)\n]*\)/g, " ")
		.replace(/!\[[^\]\n]*\]\[[^\]\n]*\]/g, " ")
		.replace(/!\[[^\]\n]*\]/g, " ")
		.replace(/\[([^\]\n]+)\]\([^)\n]*\)/g, "$1")
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
