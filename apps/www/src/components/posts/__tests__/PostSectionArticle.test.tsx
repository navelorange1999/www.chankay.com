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

import {
	buildPostSectionArticleMetadata,
	buildPostSectionStaticParams,
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
})
