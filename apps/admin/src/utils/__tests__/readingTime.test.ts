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
		const markdown = [
			"[visible label](https://example.com/hidden-destination)",
			"![ignored alt text](https://example.com/image.png)",
			"`ignored inline code`",
			"```ts",
			"ignored fenced code",
			"```",
		].join("\n")

		expect(estimateReadingTimeFromMarkdown(markdown)).toBe(1)
	})

	it("returns zero when no readable content remains", () => {
		expect(estimateReadingTimeFromMarkdown("```ts\nconst value = 1\n```")).toBe(0)
		expect(estimateReadingTimeFromMarkdown(undefined)).toBe(0)
	})
})
