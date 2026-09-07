import { describe, expect, it } from "vitest"
import { POST_CONTENT_H1_ERROR, validatePostMarkdownBody } from "../validatePostContent"

describe("validatePostMarkdownBody", () => {
	it.each([
		"Intro paragraph\n\n## Section",
		"Intro paragraph\n\n### Subsection",
		"```md\n# Example heading\n```\n\n## Real section",
		"~~~html\n<h1>Example</h1>\n~~~\n\nNormal body",
		"Inline `<h1>example</h1>`",
		"## Section\n===",
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
	])("rejects an H1 in %j", (value) => {
		expect(validatePostMarkdownBody(value)).toBe(POST_CONTENT_H1_ERROR)
	})
})
