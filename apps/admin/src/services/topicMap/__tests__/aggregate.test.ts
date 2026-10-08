import { describe, expect, it } from "vitest"

import { aggregateTopicMap } from "../aggregate"

const categories = [
	{ id: "technical", label: "Technical", sortOrder: 0 },
	{ id: "trading", label: "Trading", sortOrder: 1 },
]

const tags = [
	{ id: "react", label: "React" },
	{ id: "typescript", label: "TypeScript" },
	{ id: "risk", label: "Risk" },
	{ id: "valuation", label: "Valuation" },
	{ id: "notes", label: "Notes" },
]

describe("aggregateTopicMap", () => {
	it("counts each distinct tag assignment and preserves untagged articles", () => {
		const result = aggregateTopicMap({
			posts: [
				{ id: "p1", category: "technical", tags: ["react", "typescript"] },
				{ id: "p2", category: "technical", tags: ["react"] },
				{ id: "p3", category: "technical", tags: [] },
				{ id: "p4", category: "trading", tags: ["risk", "valuation"] },
				{ id: "p5", category: "technical", tags: ["react", "react"] },
				{ id: "p8", category: null, tags: ["notes"] },
			],
			categories,
			tags,
			locale: "en",
			labels: { uncategorized: "Uncategorized", untagged: "Untagged" },
		})

		expect(result.totals).toEqual({
			publishedPostCount: 6,
			tagAssignmentCount: 7,
			untaggedPostCount: 1,
			areaValue: 8,
		})
		expect(result.categories.map(({ id, areaValue }) => [id, areaValue])).toEqual([
			["technical", 5],
			["trading", 2],
			["synthetic:uncategorized", 1],
		])
		expect(result.categories[0]?.topics.map(({ label, value }) => [label, value])).toEqual([
			["React", 3],
			["Untagged", 1],
			["TypeScript", 1],
		])
	})

	it("treats missing taxonomy as synthetic buckets and counts duplicate posts once", () => {
		const result = aggregateTopicMap({
			posts: [
				{ id: "same", category: "missing", tags: ["missing"] },
				{ id: "same", category: "technical", tags: ["react"] },
			],
			categories,
			tags,
			locale: "en",
			labels: { uncategorized: "Uncategorized", untagged: "Untagged" },
		})

		expect(result.totals).toEqual({
			publishedPostCount: 1,
			tagAssignmentCount: 0,
			untaggedPostCount: 1,
			areaValue: 1,
		})
		expect(result.categories[0]?.kind).toBe("uncategorized")
	})

	it("returns an empty response for no published articles", () => {
		const result = aggregateTopicMap({
			posts: [],
			categories,
			tags,
			locale: "en",
			labels: { uncategorized: "Uncategorized", untagged: "Untagged" },
		})
		expect(result.categories).toEqual([])
		expect(result.totals.areaValue).toBe(0)
	})
})
