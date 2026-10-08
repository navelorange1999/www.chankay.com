import { describe, expect, it } from "vitest"
import { topicMapToTree, topicMapTones } from "@/services/payload/topicMapAdapter"
import { isTopicMapResponse, type TopicMapResponse } from "@/services/payload/topicMap"

export const response: TopicMapResponse = {
	schemaVersion: 2,
	metric: "published-posts",
	locale: "en",
	generatedAt: "2026-09-29T00:00:00.000Z",
	totals: { publishedPostCount: 9, areaValue: 9 },
	categories: [
		{
			id: "category",
			kind: "category",
			label: "Category",
			publishedPostCount: 9,
			areaValue: 9,
			articles: Array.from({ length: 9 }, (_, index) => ({
				id: `post-${index}`,
				slug: `article-${index}`,
				title: `Article ${index}`,
				value: 1 as const,
			})),
		},
	],
}

describe("article topic map", () => {
	it("keeps every article as an equally weighted leaf", () => {
		const tree = topicMapToTree(response)
		expect(tree.children?.[0]?.children).toEqual(
			response.categories[0]!.articles.map((article) => ({
				id: `article:${article.id}`,
				label: article.title,
				value: 1,
			}))
		)
	})
	it("validates unique article counts and rejects unsafe slugs", () => {
		expect(isTopicMapResponse(response)).toBe(true)
		for (const patch of [{ publishedPostCount: 8 }, { areaValue: 10 }]) {
			expect(isTopicMapResponse({ ...response, totals: { ...response.totals, ...patch } })).toBe(
				false
			)
		}
		const changed = structuredClone(response)
		changed.categories[0]!.articles[0]!.slug = "../secret"
		expect(isTopicMapResponse(changed)).toBe(false)
		changed.categories[0]!.articles[0]!.slug = "article-0"
		changed.categories[0]!.articles[1]!.id = "post-0"
		expect(isTopicMapResponse(changed)).toBe(false)
		changed.categories[0]!.articles[1]!.id = "post-1"
		changed.categories[0]!.publishedPostCount = 8
		expect(isTopicMapResponse(changed)).toBe(false)
	})
	it("keeps category colors stable when ordering changes", () => {
		const expanded = {
			...response,
			categories: [...response.categories, { ...response.categories[0]!, id: "other" }],
		}
		expect(topicMapTones(expanded).category).toBe(
			topicMapTones({ ...expanded, categories: [...expanded.categories].reverse() }).category
		)
	})
})
