import { describe, expect, it, vi } from "vitest"

import type { PublicationInventoryRow } from "../../publicationMigration/inventory"
import type { TaxonomyInventoryRow } from "../../taxonomyMigration/inventory"
import { buildContentMigrationReview, collectContentMigrationReview } from "../review"

const publicationRow: PublicationInventoryRow = {
	collection: "posts",
	id: "post-1",
	createdAt: "2025-01-01T00:00:00.000Z",
	updatedAt: "2026-01-01T00:00:00.000Z",
	hasChangedSinceCutoff: false,
	legacyStatus: "draft",
	nativeStatus: "draft",
	progress: null,
	hasNewerDraft: null,
	plan: { decision: "keep" },
}

const taxonomyRow: TaxonomyInventoryRow = {
	id: "post-1",
	updatedAt: publicationRow.updatedAt,
	legacyStatus: "draft",
	nativeStatus: "draft",
	current: {
		id: "post-1",
		category: null,
		primaryTag: "classification",
		tags: ["classification", "react"],
	},
	plan: { id: "post-1", category: "technical", tags: ["react"], changed: true },
}

describe("content migration review", () => {
	it("keeps matching publication and taxonomy plans together", () => {
		const review = buildContentMigrationReview([publicationRow], [taxonomyRow])
		expect(review.ready).toBe(true)
		expect(review.crossBlocked).toEqual([])
		expect(review.taxonomy.actions).toHaveLength(1)
	})

	it("blocks both plans when the two inventories captured different Post versions", () => {
		const review = buildContentMigrationReview(
			[publicationRow],
			[{ ...taxonomyRow, updatedAt: "2026-01-02T00:00:00.000Z" }]
		)
		expect(review.ready).toBe(false)
		expect(review.crossBlocked).toEqual([
			{ id: "post-1", reason: "Publication and taxonomy snapshots differ." },
		])
		expect(review.publication.actions).toEqual([])
		expect(review.taxonomy.actions).toEqual([])
	})

	it("blocks when either inventory omits a Post", () => {
		const review = buildContentMigrationReview([publicationRow], [])
		expect(review.ready).toBe(false)
		expect(review.crossBlocked).toEqual([
			{ id: "post-1", reason: "Post is missing from the taxonomy inventory." },
		])
		expect(review.publication.actions).toEqual([])
		expect(review.taxonomy.actions).toEqual([])

		const inverse = buildContentMigrationReview([], [taxonomyRow])
		expect(inverse.ready).toBe(false)
		expect(inverse.crossBlocked).toEqual([
			{ id: "post-1", reason: "Post is missing from the publication inventory." },
		])
	})

	it("withholds every action when one inventory requires editorial review", () => {
		const review = buildContentMigrationReview(
			[{ ...publicationRow, plan: { decision: "review", reason: "Needs editorial approval." } }],
			[taxonomyRow]
		)
		expect(review.ready).toBe(false)
		expect(review.publication.blocked).toEqual([
			{ collection: "posts", id: "post-1", reason: "Needs editorial approval." },
		])
		expect(review.taxonomy.actions).toEqual([])
	})

	it("collects read-only inventories and rejects Posts changed between the two scans", async () => {
		let postReads = 0
		const find = vi.fn(async ({ collection, where }: { collection: string; where?: unknown }) => {
			if (collection !== "posts" || where) return { docs: [], totalPages: 1 }
			postReads += 1
			return {
				docs: [
					{
						id: "post-1",
						createdAt: "2025-01-01T00:00:00.000Z",
						updatedAt: postReads === 1 ? "2026-01-01T00:00:00.000Z" : "2026-01-02T00:00:00.000Z",
						status: "draft",
						_status: "draft",
						primaryTag: null,
						tags: [],
					},
				],
				totalPages: 1,
			}
		})
		const review = await collectContentMigrationReview({ db: { find } } as never, {
			legacyBefore: "2026-09-28T00:00:00.000Z",
			categoryByTagId: {},
		})
		expect(review.ready).toBe(false)
		expect(review.crossBlocked).toEqual([
			{ id: "post-1", reason: "Publication and taxonomy snapshots differ." },
		])
		expect(review.inventories.publication).toHaveLength(1)
		expect(review.inventories.taxonomy).toHaveLength(1)
		expect(review.publication.actions).toEqual([])
		expect(review.taxonomy.actions).toEqual([])
		expect(postReads).toBe(2)
		expect(new Set(find.mock.calls.map(([query]) => query.collection))).toEqual(
			new Set(["posts", "pages", "series", "media", "categories"])
		)
		expect(find).not.toHaveBeenCalledWith(expect.objectContaining({ collection: "tags" }))
	})
})
