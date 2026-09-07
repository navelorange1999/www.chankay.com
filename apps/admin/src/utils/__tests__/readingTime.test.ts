import { describe, expect, it } from "vitest"

import { estimateReadingTimeFromMarkdown } from "../readingTime"

describe("estimateReadingTimeFromMarkdown", () => {
	it("counts Han characters at 400 characters per minute", () => {
		expect(estimateReadingTimeFromMarkdown("猪".repeat(800))).toBe(2)
	})

	it("counts non-Han words at 200 words per minute", () => {
		expect(
			estimateReadingTimeFromMarkdown(
				Array.from({ length: 400 }, (_, index) => `word${index}`).join(" ")
			)
		).toBe(2)
	})

	it("adds Chinese and non-Chinese reading durations", () => {
		const english = Array.from({ length: 200 }, (_, index) => `word${index}`).join(" ")

		expect(estimateReadingTimeFromMarkdown(`${"猪".repeat(400)} ${english}`)).toBe(2)
	})

	it("ignores code and image syntax while retaining visible link labels", () => {
		const words = (count: number, prefix: string) =>
			Array.from({ length: count }, (_, index) => `${prefix}${index}`).join(" ")
		const visibleLabel = words(200, "visible")
		const ignoredAltText = words(400, "image-alt")
		const ignoredInlineCode = words(400, "inline-code")
		const ignoredFencedCode = words(400, "fenced-code")
		const markdown = [
			`[${visibleLabel}](https://example.com/hidden-destination)`,
			`![${ignoredAltText}](https://example.com/image.png)`,
			`\`${ignoredInlineCode}\``,
			"```ts",
			ignoredFencedCode,
			"```",
		].join("\n")

		expect(estimateReadingTimeFromMarkdown(markdown)).toBe(1)
	})

	it("returns zero when no readable content remains", () => {
		expect(estimateReadingTimeFromMarkdown("```ts\nconst value = 1\n```")).toBe(0)
		expect(estimateReadingTimeFromMarkdown("# **_~~> -")).toBe(0)
		expect(estimateReadingTimeFromMarkdown(undefined)).toBe(0)
	})
})
