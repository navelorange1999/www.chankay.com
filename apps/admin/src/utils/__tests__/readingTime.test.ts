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

	it("does not treat a line-start inline span as a fenced block", () => {
		const markdown = "```inline code```\n" + words(400, "visibleAfterInlineSpan")

		expect(estimateReadingTimeFromMarkdown(markdown)).toBe(2)
	})

	it("counts visible text around escaped backticks", () => {
		const markdown = "\\`" + words(400, "escapedBacktickVisible") + "\\`"

		expect(estimateReadingTimeFromMarkdown(markdown)).toBe(2)
	})

	it("does not bridge unmatched backticks across paragraphs", () => {
		const markdown = [
			"`" + words(200, "firstParagraphVisible"),
			words(200, "secondParagraphVisible") + "`",
		].join("\n\n")

		expect(estimateReadingTimeFromMarkdown(markdown)).toBe(2)
	})

	it("excludes tilde-fenced code inside blockquotes", () => {
		const markdown = ["> ~~~ts", "> " + words(400, "hiddenQuoteCode"), "> ~~~"].join("\n")

		expect(estimateReadingTimeFromMarkdown(markdown)).toBe(0)
	})

	it("excludes fenced code inside list items", () => {
		const markdown = ["-", "  ~~~ts", "  " + words(400, "hiddenListCode"), "  ~~~"].join("\n")

		expect(estimateReadingTimeFromMarkdown(markdown)).toBe(0)
	})

	it("excludes resolved images with nested alt text", () => {
		const markdown = "![hidden [nested]](https://example.com/image.png)"

		expect(estimateReadingTimeFromMarkdown(markdown)).toBe(0)
	})

	it("does not count image titles containing closing parentheses", () => {
		const markdown =
			`![${words(400, "imageAlt")}]` +
			`(https://example.com/image.png "hidden ) ${words(400, "imageTitle")}")`

		expect(estimateReadingTimeFromMarkdown(markdown)).toBe(0)
	})

	it("excludes resolved images with wrapped reference definitions", () => {
		const markdown = [
			`![${words(400, "wrappedReferenceAlt")}][wrapped-image]`,
			"",
			"[wrapped-image]:",
			"  <https://example.com/wrapped-image.png>",
		].join("\n")

		expect(estimateReadingTimeFromMarkdown(markdown)).toBe(0)
	})

	it("retains invalid definition-like lines as visible text", () => {
		const markdown = ["[note]: ", words(400, "visibleAfterInvalidNote")].join("\n")

		expect(estimateReadingTimeFromMarkdown(markdown)).toBe(3)
	})

	it("preserves unmatched inline backtick runs", () => {
		expect(estimateReadingTimeFromMarkdown("`" + words(400, "visibleAfterUnmatchedRun"))).toBe(2)
	})

	it("excludes unclosed fenced blocks through end of input", () => {
		const markdown = ["~~~ts", words(400, "hiddenUntilEof")].join("\n")

		expect(estimateReadingTimeFromMarkdown(markdown)).toBe(0)
	})

	it("ignores resolved images but retains unresolved shortcut image text", () => {
		const markdown = [
			`![${words(400, "resolvedEmptyImageAlt")}]()`,
			`![${words(400, "resolvedReferenceImageAlt")}][image-ref]`,
			"![resolvedCollapsedImageAlt][]",
			`![${words(400, "unresolvedShortcutImage")}]`,
			"",
			"[image-ref]: https://example.com/image-destination",
			"[resolvedCollapsedImageAlt]: https://example.com/collapsed-image",
		].join("\n")

		expect(estimateReadingTimeFromMarkdown(markdown)).toBe(2)
	})

	it("retains reference link labels while ignoring their destinations", () => {
		const markdown = [
			`[${words(200, "referenceLabel")}][article-ref]`,
			"",
			"[article-ref]: https://example.com/article-destination",
		].join("\n")

		expect(estimateReadingTimeFromMarkdown(markdown)).toBe(1)
	})

	it("does not split punctuation-adjacent link labels into extra words", () => {
		const markdown = `${words(199, "ordinaryWord")} [Payload](/payload)'s`

		expect(estimateReadingTimeFromMarkdown(markdown)).toBe(1)
	})

	it("does not split adjacent formatted fragments into extra words", () => {
		const markdown = `${words(199, "ordinaryWord")} read**able**`

		expect(estimateReadingTimeFromMarkdown(markdown)).toBe(1)
	})

	it("ignores HTML comments", () => {
		expect(estimateReadingTimeFromMarkdown(`<!-- ${words(400, "hiddenComment")} -->`)).toBe(0)
	})

	it("retains HTML container text without counting attributes", () => {
		const markdown = `<div data-hidden="${words(400, "hiddenAttribute")}">${words(200, "visibleChild")}</div>`

		expect(estimateReadingTimeFromMarkdown(markdown)).toBe(1)
	})

	it("ignores raw images and non-visible HTML blocks", () => {
		const image = `<img alt="${words(400, "hiddenAlt")}" src="https://example.com/image.png" title="${words(400, "hiddenTitle")}">`
		const nonVisibleBlocks = ["script", "style", "template"]
			.map((tag) => `<${tag}>${words(400, `hidden${tag}`)}</${tag}>`)
			.join("\n")

		expect(estimateReadingTimeFromMarkdown(`${image}\n${nonVisibleBlocks}`)).toBe(0)
	})

	it("decodes entities without counting entity names as words", () => {
		expect(estimateReadingTimeFromMarkdown("&nbsp;")).toBe(0)
		expect(
			estimateReadingTimeFromMarkdown(`${words(198, "namedEntityWord")} word &amp; word`)
		).toBe(1)
		expect(
			estimateReadingTimeFromMarkdown(`${words(198, "numericEntityWord")} word &#38; word`)
		).toBe(1)
	})

	it("returns zero when no readable content remains", () => {
		expect(estimateReadingTimeFromMarkdown("```ts\nconst value = 1\n```")).toBe(0)
		expect(estimateReadingTimeFromMarkdown("# **_~~> -")).toBe(0)
		expect(estimateReadingTimeFromMarkdown(undefined)).toBe(0)
	})
})
