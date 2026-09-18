import { renderToStaticMarkup } from "react-dom/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
	getPostBySlugForSection: vi.fn(),
	getPostsBySection: vi.fn(),
	getSiteConfig: vi.fn(),
}))

vi.mock("@/services/payload/posts", () => ({
	getPostBySlugForSection: mocks.getPostBySlugForSection,
	getPostsBySection: mocks.getPostsBySection,
}))

vi.mock("@/services/payload/site-config", () => ({
	getSiteConfig: mocks.getSiteConfig,
}))

vi.mock("@/components/lazy/PostTocDrawerClient", () => ({
	PostTocDrawerClient: () => null,
}))

import {
	buildPostSectionArticleMetadata,
	buildPostSectionStaticParams,
	PostSectionArticle,
} from "../PostSectionArticle"

describe("PostSectionArticle", () => {
	beforeEach(() => {
		mocks.getPostBySlugForSection.mockReset()
		mocks.getPostsBySection.mockReset()
		mocks.getSiteConfig.mockReset()
	})

	it("omits unsafe CMS slugs from static article params", async () => {
		mocks.getPostsBySection.mockResolvedValue([{ slug: " .. " }, { slug: "market-view" }])

		const params = await buildPostSectionStaticParams("technical")

		expect(params).toEqual([
			{ locale: "en", slug: "market-view" },
			{ locale: "zh-CN", slug: "market-view" },
		])
	})

	it("does not construct article metadata for unsafe route slugs", async () => {
		const metadata = await buildPostSectionArticleMetadata("technical", "en", " .. ")

		expect(metadata.alternates).toBeUndefined()
		expect(mocks.getPostBySlugForSection).not.toHaveBeenCalled()
		expect(mocks.getSiteConfig).not.toHaveBeenCalled()
	})

	it.each([
		{ section: "technical" as const, primaryTag: { id: "technical-id", name: "Technical" } },
		{ section: "trading" as const, primaryTag: "trading-id" },
	])(
		"hides the $section primary tag but keeps other tags on the article",
		async ({ section, primaryTag }) => {
			const sectionTag = {
				id: `${section}-id`,
				name: section === "technical" ? "Technical" : "Trading",
			}
			mocks.getPostBySlugForSection.mockResolvedValue({
				id: "post-id",
				slug: "market-view",
				title: "Market view",
				content: "## Context\nA short article.",
				primaryTag,
				tags: [sectionTag, { id: "topic-id", name: "Macro" }],
			})

			const markup = renderToStaticMarkup(
				await PostSectionArticle({ locale: "en", section, slug: "market-view" })
			)
			const articleTags = Array.from(
				markup.matchAll(/<span data-slot="post-tag"[^>]*>([^<]*)<\/span>/g),
				(match) => match[1]
			)

			expect(articleTags).not.toContain(sectionTag.name)
			expect(articleTags).toContain("Macro")
		}
	)
})
