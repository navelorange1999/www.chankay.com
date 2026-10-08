import { describe, expect, it, vi } from "vitest"

import { collectTaxonomyInventory } from "../inventory"

describe("taxonomy inventory", () => {
	it("reads every post without bodies and leaves unmapped tags visible", async () => {
		const find = vi.fn(async ({ collection, page }: { collection: string; page: number }) =>
			collection === "tags"
				? { docs: [{ id: "classification" }], totalPages: 1 }
				: collection === "categories"
					? { docs: [{ id: "technical" }], totalPages: 1 }
					: page === 1
						? {
								docs: [
									{
										id: "p1",
										updatedAt: "2026-09-29",
										status: "published",
										_status: "draft",
										category: null,
										primaryTag: "unknown",
										tags: ["react"],
									},
								],
								totalPages: 2,
							}
						: {
								docs: [
									{
										id: "p2",
										category: null,
										primaryTag: "classification",
										tags: ["classification", "react"],
									},
								],
								totalPages: 2,
							}
		)
		const rows = await collectTaxonomyInventory({ db: { find } } as never, {
			classification: "technical",
		})
		expect(rows).toHaveLength(2)
		expect(rows[0]?.plan).toMatchObject({ category: null, tags: ["react", "unknown"] })
		expect(rows[0]).toMatchObject({ legacyStatus: "published", nativeStatus: "draft" })
		expect(rows[1]?.plan).toMatchObject({ category: "technical", tags: ["react"] })
		expect(find).toHaveBeenCalledWith(
			expect.objectContaining({
				limit: 200,
				select: expect.not.objectContaining({ content: true }),
			})
		)
	})

	it("rejects an unpublished or missing Category in the approved mapping", async () => {
		const find = vi.fn(async ({ collection }: { collection: string }) => ({
			docs: collection === "tags" ? [{ id: "classification" }] : [],
			totalPages: 1,
		}))
		await expect(
			collectTaxonomyInventory({ db: { find } } as never, {
				classification: "technical",
			})
		).rejects.toThrow("unpublished or missing")
		expect(find).not.toHaveBeenCalledWith(expect.objectContaining({ collection: "posts" }))
	})

	it("flags a public Post whose existing Category is no longer published", async () => {
		const find = vi.fn(async ({ collection }: { collection: string }) => ({
			docs: collection === "posts"
				? [{ id: "p1", updatedAt: "2026-09-29T00:00:00.000Z", status: "published", _status: "published", category: "withdrawn", tags: [] }]
				: [],
			totalPages: 1,
		}))
		const rows = await collectTaxonomyInventory({ db: { find } } as never, {})
		expect(rows[0]?.plan.reviewReason).toBe("A public Post references a missing or unpublished Category.")
	})
})
