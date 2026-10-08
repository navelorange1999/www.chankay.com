import type { Payload } from "payload"
import { describe, expect, it, vi } from "vitest"

import { getPublicTopicArticles, TopicSelectionUnavailable } from "../articles"

function payloadWithFixtures(posts: Array<Record<string, unknown>>) {
	const find = vi.fn(
		async ({
			collection,
			where,
			limit,
			page,
		}: {
			collection: string
			where?: { and?: Array<Record<string, { equals: string }>> }
			limit?: number
			page?: number
		}) => {
			if (collection !== "posts")
				return {
					docs:
						collection === "categories"
							? [{ id: "technical" }, { id: "trading" }]
							: [{ id: "react" }, { id: "risk" }],
					totalDocs: 2,
					totalPages: 1,
					hasNextPage: false,
				}
			const category = where?.and?.find((clause) => clause.category)?.category?.equals
			const tag = where?.and?.find((clause) => clause.tags)?.tags?.equals
			const matching = posts.filter(
				(post) =>
					(!category || post.category === category) &&
					(!tag || (Array.isArray(post.tags) && post.tags.includes(tag)))
			)
			const start = ((page ?? 1) - 1) * (limit ?? matching.length)
			return {
				docs: matching.slice(start, start + (limit ?? matching.length)),
				totalDocs: matching.length,
				totalPages: Math.max(1, Math.ceil(matching.length / (limit ?? (matching.length || 1)))),
				hasNextPage: start + (limit ?? matching.length) < matching.length,
			}
		}
	)
	return { payload: { find } as unknown as Payload, find }
}

describe("getPublicTopicArticles", () => {
	it("queries a real category and tag directly with stable database pagination", async () => {
		const find = vi.fn(async ({ collection }: { collection: string }) => ({
			docs:
				collection === "categories"
					? [{ id: "technical" }]
					: collection === "tags"
						? [{ id: "react" }]
						: [{ id: "post-11", slug: "post-11", title: "Post 11" }],
			totalDocs: collection === "posts" ? 11 : 1,
			totalPages: collection === "posts" ? 2 : 1,
			hasNextPage: false,
		}))
		const result = await getPublicTopicArticles({ find } as unknown as Payload, "en", {
			category: "technical",
			topic: "react",
			page: 2,
		})
		const postQueries = find.mock.calls
			.map(([query]) => query)
			.filter((query) => query.collection === "posts")
		expect(postQueries).toHaveLength(1)
		expect(postQueries[0]).toMatchObject({
			where: {
				and: [
					{ _status: { equals: "published" } },
					{ category: { equals: "technical" } },
					{ tags: { equals: "react" } },
				],
			},
			limit: 10,
			page: 2,
			sort: ["-publishedAt", "id"],
		})
		expect(result.totalDocs).toBe(11)
		expect(result.docs).toEqual([{ id: "post-11", slug: "post-11", title: "Post 11" }])
	})

	it("returns only the selected category and tag, one summary per post", async () => {
		const { payload, find } = payloadWithFixtures([
			{ id: "one", slug: "one", title: "One", category: "technical", tags: ["react", "react"] },
			{ id: "two", slug: "two", title: "Two", category: "trading", tags: ["react"] },
			{ id: "three", slug: "three", title: "Three", category: "technical", tags: ["risk"] },
		])
		const result = await getPublicTopicArticles(payload, "en", {
			category: "technical",
			topic: "react",
			page: 1,
		})
		expect(result.totalDocs).toBe(1)
		expect(result.docs).toEqual([{ id: "one", slug: "one", title: "One" }])
		for (const [query] of find.mock.calls) {
			expect(query).toMatchObject({ draft: false, overrideAccess: false })
		}
	})

	it("narrows synthetic candidates by a real category and preserves the untagged fallback", async () => {
		const { payload, find } = payloadWithFixtures([
			{ id: "one", slug: "one", title: "One", category: "technical", tags: ["draft"] },
			{ id: "two", slug: "two", title: "Two", category: "trading", tags: ["draft"] },
		])
		const result = await getPublicTopicArticles(payload, "en", {
			category: "technical",
			topic: "synthetic:untagged",
			page: 1,
		})
		expect(result.docs.map((post) => post.id)).toEqual(["one"])
		const postQuery = find.mock.calls
			.map(([query]) => query)
			.find((query) => query.collection === "posts")
		expect(postQuery?.where).toMatchObject({
			and: [{ _status: { equals: "published" } }, { category: { equals: "technical" } }],
		})
	})

	it("treats withdrawn references as uncategorized and untagged", async () => {
		const { payload } = payloadWithFixtures([
			{ id: "orphan", slug: "orphan", title: "Orphan", category: "draft", tags: ["draft"] },
		])
		const result = await getPublicTopicArticles(payload, "en", {
			category: "synthetic:uncategorized",
			topic: "synthetic:untagged",
			page: 1,
		})
		expect(result.docs.map((post) => post.id)).toEqual(["orphan"])
		await expect(
			getPublicTopicArticles(payload, "en", { category: "draft", topic: "react", page: 1 })
		).rejects.toBeInstanceOf(TopicSelectionUnavailable)
	})
})
