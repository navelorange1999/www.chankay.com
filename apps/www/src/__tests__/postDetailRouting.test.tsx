import { beforeEach, describe, expect, it, vi } from "vitest"

const { getPostBySlug, permanentRedirect } = vi.hoisted(() => ({
	getPostBySlug: vi.fn(),
	permanentRedirect: vi.fn((path: string) => {
		throw new Error(`redirect:${path}`)
	}),
}))
vi.mock("@/services/payload/posts", () => ({ getPostBySlug }))
vi.mock("next/navigation", () => ({
	permanentRedirect,
	notFound: () => {
		throw new Error("not-found")
	},
}))
vi.mock("@/components/posts/PostSectionArticle", () => ({
	PostSectionArticle: () => null,
	buildPostSectionArticleMetadata: vi.fn(),
}))

import LegacyPostPage from "@/app/[locale]/(frontend)/posts/[slug]/page"

beforeEach(() => vi.clearAllMocks())

describe("topic map article destinations", () => {
	it("redirects an article by its published category despite a stale primary tag", async () => {
		getPostBySlug.mockResolvedValue({
			id: "post",
			slug: "article",
			category: { id: "category", slug: "trading", _status: "published" },
			primaryTag: { slug: "technical" },
		})
		await expect(
			LegacyPostPage({ params: Promise.resolve({ locale: "zh-CN", slug: "article" }) })
		).rejects.toThrow("redirect:/zh-CN/trading/article")
	})
	it.each([
		null,
		{ id: "category", slug: "journal", _status: "published" },
		{ id: "category", slug: "trading", _status: "draft" },
	])("renders generic detail for uncategorized or other-category articles", async (category) => {
		getPostBySlug.mockResolvedValue({ id: "post", slug: "article", category })
		const result = await LegacyPostPage({
			params: Promise.resolve({ locale: "en", slug: "article" }),
		})
		expect(result.props).toMatchObject({ locale: "en", section: null, slug: "article" })
		expect(permanentRedirect).not.toHaveBeenCalled()
	})
	it("returns not found for an unavailable published article", async () => {
		getPostBySlug.mockResolvedValue(null)
		await expect(
			LegacyPostPage({ params: Promise.resolve({ locale: "en", slug: "article" }) })
		).rejects.toThrow("not-found")
	})
})
