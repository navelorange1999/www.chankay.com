import type { Payload } from "payload"
import { describe, expect, it, vi } from "vitest"

import { getPublicTopicMap } from "../query"

describe("getPublicTopicMap", () => {
	it("reads every published metadata page under public access", async () => {
		const find = vi.fn(async ({ collection, page }: { collection: string; page: number }) => {
			if (collection === "categories")
				return { docs: [{ id: "category", name: "Category" }], totalPages: 1 }
			if (collection === "tags") return { docs: [{ id: "tag", name: "Tag" }], totalPages: 1 }
			return {
				docs:
					page === 1
						? Array.from({ length: 200 }, (_, index) => ({
								id: `post-${index}`,
								category: "category",
								tags: ["tag"],
							}))
						: [{ id: "post-200", category: "category", tags: ["tag"] }],
				totalPages: 2,
			}
		})
		const result = await getPublicTopicMap({ find } as unknown as Payload, "en", {
			uncategorized: "Uncategorized",
			untagged: "Untagged",
		})
		expect(result.totals).toMatchObject({
			publishedPostCount: 201,
			tagAssignmentCount: 201,
			areaValue: 201,
		})
		expect(find).toHaveBeenCalledTimes(4)
		for (const [query] of find.mock.calls) {
			expect(query).toMatchObject({ where: { _status: { equals: "published" } } })
			if (query.collection !== "posts") expect(query).toMatchObject({ joins: false })
		}
	})
})
