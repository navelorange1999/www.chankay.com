import { describe, expect, it } from "vitest"
import type { SiteConfig } from "@repo/typescript-config/typings/payload-types"

import { buildWebsiteStructuredData, serializeStructuredData } from "@/utils/structuredData"

const site = {
	siteName: "Example Blog",
	siteUrl: "https://blog.example.org",
	metaDescription: "Personal notes.",
} as SiteConfig

describe("website structured data", () => {
	it("derives site identity from CMS and leaves unspecified authors out", () => {
		const data = buildWebsiteStructuredData(site, "en")
		expect(data).toMatchObject({
			"@context": "https://schema.org",
			"@type": "WebSite",
			name: site.siteName,
			url: "https://blog.example.org/",
			description: site.metaDescription,
			inLanguage: "en",
		})
		expect(data).not.toHaveProperty("author")
	})

	it("includes only explicitly configured author information", () => {
		const data = buildWebsiteStructuredData(
			{ ...site, author: { name: "Example Author", url: "https://blog.example.org/about" } },
			"zh-CN"
		)
		expect(data).toMatchObject({
			url: "https://blog.example.org/zh-CN",
			inLanguage: "zh-CN",
			author: { "@type": "Person", name: "Example Author", url: "https://blog.example.org/about" },
		})
	})

	it("omits unsafe author URLs and empty names", () => {
		const unsafe = buildWebsiteStructuredData(
			{ ...site, author: { name: "Example Author", url: "javascript:alert(1)" } },
			"en"
		)
		expect(unsafe.author).not.toHaveProperty("url")
		expect(buildWebsiteStructuredData({ ...site, author: { name: " " } }, "en")).not.toHaveProperty(
			"author"
		)
	})

	it("escapes script-closing text without changing the parsed data", () => {
		const input = { name: "</script><script>alert(1)</script>" }
		const serialized = serializeStructuredData(input)
		expect(serialized).not.toContain("<")
		expect(JSON.parse(serialized)).toEqual(input)
	})
})
