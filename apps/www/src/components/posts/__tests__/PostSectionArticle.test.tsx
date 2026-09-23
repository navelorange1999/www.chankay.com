import { renderToStaticMarkup } from "react-dom/server"
import { createElement } from "react"
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

vi.mock("../PostCommentsClient", () => ({
	PostCommentsClient: ({ config, locale }: { config: { term: string }; locale: string }) =>
		createElement("div", { "data-comment-term": config.term, "data-comment-locale": locale }),
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

	it.each(["technical", "trading"] as const)(
		"renders shared comments for both locales in %s",
		async (section) => {
			mocks.getPostBySlugForSection.mockResolvedValue({
				id: "shared-post",
				slug: "article",
				title: "Article",
				content: "## Content\nBody.",
				status: "published",
				_status: "published",
			})
			mocks.getSiteConfig.mockResolvedValue({
				giscus: {
					enabled: true,
					repo: "navelorange1999/chankay-discussions",
					repoId: "R_kgDOUk_WeA",
					category: "Announcements",
					categoryId: "DIC_kwDOUk_WeM4DGIzk",
				},
			})
			for (const locale of ["en", "zh-CN"] as const) {
				const markup = renderToStaticMarkup(
					await PostSectionArticle({ section, locale, slug: "article" })
				)
				expect(mocks.getPostBySlugForSection).toHaveBeenCalledWith("article", section, {
					locale,
					revalidate: 60,
				})
				expect(mocks.getSiteConfig).toHaveBeenCalledWith(locale, 60)
				expect(markup).toContain('data-comment-term="post:shared-post"')
				expect(markup).toContain(`data-comment-locale="${locale}"`)
				expect(markup).toContain(
					locale === "en" ? "View discussions on GitHub" : "在 GitHub 查看讨论"
				)
			}
		}
	)

	it("omits the entire comment section for a disabled post", async () => {
		mocks.getPostBySlugForSection.mockResolvedValue({
			id: "shared-post",
			slug: "article",
			title: "Article",
			content: "## Content\nBody.",
			status: "published",
			commentsEnabled: false,
		})
		mocks.getSiteConfig.mockResolvedValue({
			giscus: {
				enabled: true,
				repo: "navelorange1999/chankay-discussions",
				repoId: "R_kgDOUk_WeA",
				category: "Announcements",
				categoryId: "DIC_kwDOUk_WeM4DGIzk",
			},
		})
		const markup = renderToStaticMarkup(
			await PostSectionArticle({ section: "technical", locale: "en", slug: "article" })
		)
		expect(markup).not.toContain('id="comments"')
		expect(markup).not.toContain("data-comment-term")
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
