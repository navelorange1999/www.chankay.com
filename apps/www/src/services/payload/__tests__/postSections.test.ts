import { beforeEach, describe, expect, it, vi } from "vitest"

const { getBySlug, getCollection } = vi.hoisted(() => ({
	getBySlug: vi.fn(),
	getCollection: vi.fn(),
}))

vi.mock("@/utils/payloadClient", () => ({
	payloadClient: { getBySlug, getCollection },
}))

import { getPostBySlugForSection, getPostsBySection } from "../posts"
import { getTagBySlug } from "../tags"

describe("post section payload services", () => {
	beforeEach(() => {
		getBySlug.mockReset()
		getCollection.mockReset()
	})

	it("resolves the section tag before querying posts", async () => {
		getBySlug.mockResolvedValueOnce({ id: "technical-id", slug: "technical" })
		getCollection.mockResolvedValueOnce({ docs: [], totalDocs: 0 })

		await getPostsBySection("technical")

		expect(getBySlug).toHaveBeenCalledWith("tags", "technical", {
			locale: "en",
			depth: 0,
			tags: ["tag:technical:en"],
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
				primaryTag: { equals: "trading-id" },
				status: { equals: "published" },
			},
			tags: ["posts:section:trading:en"],
		})
		expect(getCollection).toHaveBeenNthCalledWith(2, "posts", {
			locale: "en",
			limit: 100,
			page: 2,
			depth: 2,
			sort: "-publishedAt",
			where: {
				primaryTag: { equals: "trading-id" },
				status: { equals: "published" },
			},
			tags: ["posts:section:trading:en"],
		})
	})

	it("returns no posts without querying posts when the section tag is absent", async () => {
		getBySlug.mockResolvedValueOnce(null)

		await expect(getPostsBySection("trading")).resolves.toEqual([])
		expect(getCollection).not.toHaveBeenCalled()
	})

	it("returns null when a post belongs to a different section", async () => {
		getBySlug.mockResolvedValueOnce({
			id: "post-id",
			slug: "market-view",
			primaryTag: { id: "trading-id", slug: "trading" },
		})

		await expect(getPostBySlugForSection("market-view", "technical")).resolves.toBeNull()
	})

	it("fetches a tag by slug with localized cache metadata", async () => {
		getBySlug.mockResolvedValueOnce({ id: "trading-id", slug: "trading" })

		await expect(getTagBySlug("trading", { locale: "zh-CN" })).resolves.toEqual({
			id: "trading-id",
			slug: "trading",
		})
		expect(getBySlug).toHaveBeenCalledWith("tags", "trading", {
			locale: "zh-CN",
			depth: 0,
			tags: ["tag:trading:zh-CN"],
		})
	})
})
