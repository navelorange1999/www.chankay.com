import { describe, expect, it } from "vitest"

import { estimateReadingTimeFromMarkdown } from "../readingTime"

const words = (count: number, prefix: string) =>
	Array.from({ length: count }, (_, index) => `${prefix}${index}`).join(" ")

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

	it("ignores tilde-fenced code and multi-backtick inline code", () => {
		const markdown = [
			"   ~~~ts",
			words(400, "tilde-code"),
			"   ~~~",
			"``" + words(400, "multi-backtick-code") + "``",
		].join("\n")

		expect(estimateReadingTimeFromMarkdown(markdown)).toBe(0)
	})

	it("requires fenced code closers to match the opening length", () => {
		const markdown = [
			"  ~~~~ts",
			words(400, "hidden-before-short-close"),
			"  ~~~",
			words(400, "hidden-after-short-close"),
			"  ~~~~",
			words(200, "visibleAfterFence"),
		].join("\n")

		expect(estimateReadingTimeFromMarkdown(markdown)).toBe(1)
	})

	it("matches complete inline backtick runs and preserves visible prose", () => {
		const markdown = [
			"``outer " + "```" + "internal``",
			words(400, "visibleAfterInline"),
			"`" + words(400, "single-backtick-code") + "`",
		].join("\n")

		expect(estimateReadingTimeFromMarkdown(markdown)).toBe(2)
	})

	it("ignores empty and reference-style images and their definitions", () => {
		const markdown = [
			`![${words(400, "empty-image-alt")}]()`,
			`![${words(400, "reference-image-alt")}][image-ref]`,
			`![${words(400, "collapsed-image-alt")}][]`,
			`![${words(400, "shortcut-image-alt")}]`,
			"[image-ref]: https://example.com/image-destination",
		].join("\n")

		expect(estimateReadingTimeFromMarkdown(markdown)).toBe(0)
	})

	it("retains reference link labels while ignoring their destinations", () => {
		const markdown = [
			`[${words(200, "referenceLabel")}][article-ref]`,
			"[article-ref]: https://example.com/article-destination",
		].join("\n")

		expect(estimateReadingTimeFromMarkdown(markdown)).toBe(1)
	})

	it("returns zero when no readable content remains", () => {
		expect(estimateReadingTimeFromMarkdown("```ts\nconst value = 1\n```")).toBe(0)
		expect(estimateReadingTimeFromMarkdown("# **_~~> -")).toBe(0)
		expect(estimateReadingTimeFromMarkdown(undefined)).toBe(0)
	})
})
