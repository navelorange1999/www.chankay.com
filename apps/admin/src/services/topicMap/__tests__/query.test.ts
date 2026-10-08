import type { Payload } from "payload"
import { describe, expect, it, vi } from "vitest"

import { getPublicTopicMap } from "../query"

describe("getPublicTopicMap", () => {
	it("reads every published metadata page under public access", async () => {
		const find = vi.fn(async ({ collection, page }: { collection: string; page: number }) => {
			if (collection === "categories")
				return { docs: [{ id: "category", name: "Category" }], totalPages: 1 }
			if (collection === "tags") throw new Error("Tags collection is retired")
			return {
				docs:
					page === 1
						? Array.from({ length: 200 }, (_, index) => ({
								id: `post-${index}`,
								category: "category",
								title: "Article",
								slug: "article",
							}))
						: [{ id: "post-200", category: "category", title: "Article", slug: "article" }],
				totalPages: 2,
			}
		})
		const result = await getPublicTopicMap({ find } as unknown as Payload, "en", {
			uncategorized: "Uncategorized",
		})
		expect(result.totals).toMatchObject({
			publishedPostCount: 201,
			areaValue: 201,
		})
		expect(find).toHaveBeenCalledTimes(3)
		for (const [query] of find.mock.calls) {
			expect(query).toMatchObject({
				where: { _status: { equals: "published" } },
				draft: false,
				overrideAccess: false,
				depth: 0,
			})
			if (query.collection !== "posts") expect(query).toMatchObject({ joins: false })
		}
	})
})
