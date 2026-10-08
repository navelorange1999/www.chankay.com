import { describe, expect, it } from "vitest"
import { aggregateTopicMap } from "../aggregate"

const input = {
	locale: "en",
	labels: { uncategorized: "Uncategorized" },
	categories: [
		{ id: "technical", label: "Technical" },
		{ id: "trading", label: "Trading" },
	],
	posts: [
		{ id: "one", title: "First", slug: "first", category: "technical" },
		{ id: "two", title: "Second", slug: "second", category: "trading" },
		{ id: "one", title: "Duplicate", slug: "duplicate", category: "trading" },
		{ id: "three", title: "Third", slug: "third", category: "private-category" },
	],
}
describe("article-count map", () => {
	it("counts each article once and conserves area across every category", () => {
		const result = aggregateTopicMap(input)
		expect(result.schemaVersion).toBe(2)
		expect(result.metric).toBe("published-posts")
		expect(result.totals).toEqual({ publishedPostCount: 3, areaValue: 3 })
		expect(result.categories.reduce((sum, c) => sum + c.areaValue, 0)).toBe(3)
		for (const c of result.categories) {
			expect(c.areaValue).toBe(c.articles.length)
			expect(c.articles.every((a) => a.value === 1)).toBe(true)
		}
	})
	it("uses a public fallback for missing or private categories without revealing labels", () => {
		const result = aggregateTopicMap(input)
		expect(result.categories.at(-1)).toMatchObject({
			id: "synthetic:uncategorized",
			label: "Uncategorized",
			publishedPostCount: 1,
		})
		expect(JSON.stringify(result)).not.toContain("private-category")
	})
	it("omits empty branches and returns an empty chart for no published articles", () => {
		const result = aggregateTopicMap({ ...input, posts: [] })
		expect(result.categories).toEqual([])
		expect(result.totals.areaValue).toBe(0)
	})
})
