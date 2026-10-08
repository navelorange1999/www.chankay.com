import { describe, expect, it } from "vitest"

import { isTopicArticlePage } from "@/services/payload/topicArticles"

const expected = { locale: "en" as const, category: "category-1", topic: "tag-1", page: 1 }
const page = {
	schemaVersion: 1,
	locale: "en",
	generatedAt: "2026-09-29T00:00:00.000Z",
	selection: { category: "category-1", topic: "tag-1" },
	page: 1,
	limit: 10,
	totalDocs: 1,
	hasNextPage: false,
	docs: [{ id: "post-1", slug: "post-1", title: "Post One" }],
}

describe("isTopicArticlePage", () => {
	it("accepts a matching public summary page", () => {
		expect(isTopicArticlePage(page, expected)).toBe(true)
	})

	it.each(["../private", "a/b", " . ", "article "])("rejects unsafe article slug %j", (slug) => {
		expect(
			isTopicArticlePage({ ...page, docs: [{ id: "post-1", slug, title: "Post" }] }, expected)
		).toBe(false)
	})

	it("rejects a mismatched selection and malformed summaries", () => {
		expect(
			isTopicArticlePage({ ...page, selection: { ...page.selection, topic: "tag-2" } }, expected)
		).toBe(false)
		expect(
			isTopicArticlePage(
				{
					...page,
					docs: [
						{ id: "post-1", slug: "post-1", title: "Post One" },
						{ id: "post-1", slug: "post-2", title: "Post Two" },
					],
				},
				expected
			)
		).toBe(false)
		expect(
			isTopicArticlePage(
				{ ...page, docs: [{ id: "post-1", slug: "post-1", title: null }] },
				expected
			)
		).toBe(false)
	})
})
