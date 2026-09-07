import { describe, expect, it } from "vitest"
import {
	POST_CONTENT_H1_ERROR,
	POST_CONTENT_PARSE_ERROR,
	validatePostContent,
	validatePostMarkdownBody,
} from "../validatePostContent"

describe("validatePostMarkdownBody", () => {
	it.each([
		"Intro paragraph\n\n## Section",
		"Intro paragraph\n\n### Subsection",
		"```md\n# Example heading\n```\n\n## Real section",
		"~~~html\n<h1>Example</h1>\n~~~\n\nNormal body",
		"Inline `<h1>example</h1>`",
		"## Section\n===",
		"<!-- <h1>Example</h1> -->",
		'<div title="<h1>">Body</div>',
		"",
		null,
		42,
	])("accepts %j", (value) => {
		expect(validatePostMarkdownBody(value)).toBe(true)
	})

	it.each([
		"# Duplicate title",
		"Duplicate title\n===",
		"<h1>Duplicate title</h1>",
		'<h1 class="title">Duplicate title</h1>',
		"```text `x`\n# Title",
		"> # Title",
		"- # Title",
		"<h1\nclass=title>Title</h1>",
		"<h1/>Title",
		"<div>1 < 2<h1>Title</h1></div>",
		'<div title="<!--">Body</div><h1>Title</h1><!-- -->',
	])("rejects an H1 in %j", (value) => {
		expect(validatePostMarkdownBody(value)).toBe(POST_CONTENT_H1_ERROR)
	})

	it("returns a parse error for invalid HTML entities", () => {
		expect(validatePostMarkdownBody("## &#x110000;")).toBe(POST_CONTENT_PARSE_ERROR)
	})
})

describe("validatePostContent", () => {
	const createOptions = (overrides: Record<string, unknown> = {}) =>
		({
			req: {
				payload: { config: {} },
				t: (key: string) => key,
			},
			...overrides,
		}) as Parameters<typeof validatePostContent>[1]

	it("preserves required-field validation", () => {
		expect(validatePostContent(undefined, createOptions({ required: true }))).toBe(
			"validation:required"
		)
	})

	it("returns built-in length errors before Markdown errors", () => {
		expect(validatePostContent("# Heading", createOptions({ maxLength: 3 }))).toBe(
			"validation:shorterThanMax"
		)
	})

	it("accepts valid H2 content after built-in validation", () => {
		expect(validatePostContent("## Section", createOptions({ required: true }))).toBe(true)
	})
})
