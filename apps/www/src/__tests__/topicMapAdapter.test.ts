import { describe, expect, it } from "vitest"

import { topicMapToTree, topicMapTones } from "@/services/payload/topicMapAdapter"
import { isTopicMapResponse, type TopicMapResponse } from "@/services/payload/topicMap"

const response: TopicMapResponse = {
	schemaVersion: 1,
	metric: "tag-usages-with-untagged",
	locale: "en",
	generatedAt: "2026-09-29T00:00:00.000Z",
	totals: { publishedPostCount: 9, tagAssignmentCount: 9, untaggedPostCount: 0, areaValue: 9 },
	categories: [
		{
			id: "category",
			kind: "category",
			label: "Category",
			publishedPostCount: 9,
			areaValue: 9,
			topics: Array.from({ length: 9 }, (_, index) => ({
				id: `category:tag-${index}`,
				tagId: `tag-${index}`,
				kind: "tag" as const,
				label: `Tag ${index}`,
				value: 1,
			})),
		},
	],
}

describe("topicMapToTree", () => {
	it("groups the tail without losing area or mutating complete endpoint data", () => {
		const tree = topicMapToTree(response, 8, "Other topics")
		if (!("children" in tree) || !tree.children || !("children" in tree.children[0]!))
			throw new Error("Expected branch")
		const leaves = tree.children[0].children ?? []
		expect(leaves).toHaveLength(9)
		expect(leaves.reduce((sum, leaf) => sum + ("value" in leaf ? (leaf.value ?? 0) : 0), 0)).toBe(9)
		expect(leaves.at(-1)).toEqual({ id: "other:category", label: "Other topics", value: 1 })
		expect(response.categories[0]?.topics).toHaveLength(9)
	})

	it("validates branch sums", () => {
		expect(isTopicMapResponse(response)).toBe(true)
		expect(isTopicMapResponse({ ...response, totals: { ...response.totals, areaValue: 10 } })).toBe(
			false
		)
	})

	it("keeps category colors stable when ordering changes", () => {
		const second = { ...response.categories[0]!, id: "other-category" }
		const expanded = { ...response, categories: [...response.categories, second] }
		expect(topicMapTones(expanded).category).toBe(
			topicMapTones({ ...expanded, categories: [...expanded.categories].reverse() }).category
		)
	})
})
