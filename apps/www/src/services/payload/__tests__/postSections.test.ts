import { beforeEach, describe, expect, it, vi } from "vitest"
import { POST_SLUG_MAX_LENGTH } from "@repo/i18n"

const { getBySlug, getCollection } = vi.hoisted(() => ({
	getBySlug: vi.fn(),
	getCollection: vi.fn(),
}))

vi.mock("@/utils/payloadClient", () => ({
	payloadClient: { getBySlug, getCollection },
}))

import { getPostBySlug, getPostBySlugForSection, getPostsBySection } from "../posts"
import { getCategoryBySlug } from "../categories"

describe("post section payload services", () => {
	beforeEach(() => {
		getBySlug.mockReset()
		getCollection.mockReset()
	})

	it("resolves the section category before querying posts", async () => {
		getBySlug.mockResolvedValueOnce({ id: "technical-id", slug: "technical" })
		getCollection.mockResolvedValueOnce({ docs: [], totalDocs: 0 })

		await getPostsBySection("technical")

		expect(getBySlug).toHaveBeenCalledWith("categories", "technical", {
			locale: "en",
			depth: 0,
			where: { _status: { equals: "published" } },
			tags: ["category:technical:en"],
		})
		expect(getCollection).toHaveBeenCalledWith("posts", expect.any(Object))
	})

	it("paginates published posts for a section", async () => {
		getBySlug.mockResolvedValueOnce({ id: "trading-id", slug: "trading" })
		getCollection
			.mockResolvedValueOnce({ docs: [{ id: "one" }], totalDocs: 101 })
			.mockResolvedValueOnce({ docs: [{ id: "two" }], totalDocs: 101 })

		const posts = await getPostsBySection("trading")

		expect(posts).toEqual([{ id: "one" }, { id: "two" }])
		expect(getCollection).toHaveBeenCalledTimes(2)
		expect(getCollection).toHaveBeenNthCalledWith(1, "posts", {
			locale: "en",
			limit: 100,
			page: 1,
			depth: 2,
			sort: "-publishedAt",
			where: {
				category: { equals: "trading-id" },
				_status: { equals: "published" },
			},
			tags: ["posts:section:trading:en", "post-relations:en"],
		})
		expect(getCollection).toHaveBeenNthCalledWith(2, "posts", {
			locale: "en",
			limit: 100,
			page: 2,
			depth: 2,
			sort: "-publishedAt",
			where: {
				category: { equals: "trading-id" },
				_status: { equals: "published" },
			},
			tags: ["posts:section:trading:en", "post-relations:en"],
		})
	})

	it("does not silently classify uncategorized posts as technical", async () => {
		getBySlug.mockResolvedValueOnce({ id: "technical-id", slug: "technical" })
		getCollection.mockResolvedValueOnce({ docs: [], totalDocs: 0 })
		await getPostsBySection("technical")
		expect(getCollection).toHaveBeenCalledWith(
			"posts",
			expect.objectContaining({
				where: { _status: { equals: "published" }, category: { equals: "technical-id" } },
			})
		)
	})

	it("returns no posts without querying posts when the section category is absent", async () => {
		getBySlug.mockResolvedValueOnce(null)

		await expect(getPostsBySection("trading")).resolves.toEqual([])
		expect(getCollection).not.toHaveBeenCalled()
	})

	it("returns null when a post belongs to a different section", async () => {
		getBySlug.mockResolvedValueOnce({
			id: "post-id",
			slug: "market-view",
			category: { id: "trading-id", slug: "trading" },
		})

		await expect(getPostBySlugForSection("market-view", "technical")).resolves.toBeNull()
	})

	it("tags post detail lookups with a locale-wide detail cache tag", async () => {
		getBySlug.mockResolvedValueOnce({ id: "post-id", slug: "market-view" })

		await expect(getPostBySlug("market-view", { locale: "zh-CN" })).resolves.toEqual({
			id: "post-id",
			slug: "market-view",
		})
		expect(getBySlug).toHaveBeenCalledWith("posts", "market-view", {
			locale: "zh-CN",
			revalidate: undefined,
			where: { _status: { equals: "published" } },
			depth: 2,
			tags: ["post:market-view:zh-CN", "posts:details:zh-CN", "post-relations:zh-CN"],
		})
	})

	it("forwards the article refresh interval through section lookups", async () => {
		getBySlug.mockResolvedValueOnce({ id: "post-id", slug: "article" })
		await getPostBySlugForSection("article", "technical", { locale: "en", revalidate: 60 })
		expect(getBySlug).toHaveBeenCalledWith(
			"posts",
			"article",
			expect.objectContaining({
				revalidate: 60,
			})
		)
	})

	it.each(["../private", "a".repeat(POST_SLUG_MAX_LENGTH + 1)])(
		"does not query posts for unsafe post slug %j",
		async (slug) => {
			await expect(getPostBySlug(slug)).resolves.toBeNull()
			await expect(getPostBySlugForSection(slug, "technical")).resolves.toBeNull()

			expect(getBySlug).not.toHaveBeenCalled()
		}
	)

	it("fetches a category by slug with localized cache metadata", async () => {
		getBySlug.mockResolvedValueOnce({ id: "trading-id", slug: "trading" })

		await expect(getCategoryBySlug("trading", { locale: "zh-CN" })).resolves.toEqual({
			id: "trading-id",
			slug: "trading",
		})
		expect(getBySlug).toHaveBeenCalledWith("categories", "trading", {
			locale: "zh-CN",
			depth: 0,
			where: { _status: { equals: "published" } },
			tags: ["category:trading:zh-CN"],
		})
	})
})
