import { describe, expect, it } from "vitest"

import { buildPostPreviewUrl } from "../../utils/postPreview"

describe("buildPostPreviewUrl", () => {
	const siteUrl = "https://www.example.com"

	it("uses the unprefixed route for English", () => {
		expect(buildPostPreviewUrl({ locale: "en", siteUrl, slug: "example" })).toBe(
			"https://www.example.com/posts/example",
		)
	})

	it("uses the locale-prefixed route for Chinese", () => {
		expect(buildPostPreviewUrl({ locale: "zh-CN", siteUrl, slug: "example" })).toBe(
			"https://www.example.com/zh-CN/posts/example",
		)
	})

	it("falls back to the default locale for an unsupported locale", () => {
		expect(buildPostPreviewUrl({ locale: "invalid", siteUrl, slug: "example" })).toBe(
			"https://www.example.com/posts/example",
		)
	})
})
