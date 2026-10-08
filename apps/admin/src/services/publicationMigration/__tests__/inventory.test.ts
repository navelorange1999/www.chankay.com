import { describe, expect, it, vi } from "vitest"

import { collectPublicationInventory } from "../inventory"

describe("publication inventory", () => {
	it("reads metadata only across pages and flags exposed snapshots for review", async () => {
		const find = vi.fn(async ({ collection, page }: { collection: string; page: number }) => {
			if (collection !== "posts") return { docs: [], totalPages: 1 }
			return page === 1
				? {
						docs: [
							{
								id: "post-1",
								createdAt: "2025-01-01T00:00:00.000Z",
								updatedAt: "2026-01-01T00:00:00.000Z",
								status: "published",
								_status: "draft",
							},
						],
						totalPages: 2,
					}
				: {
						docs: [
							{
								id: "post-2",
								createdAt: "2025-01-01T00:00:00.000Z",
								updatedAt: "2025-12-01T00:00:00.000Z",
								status: "archived",
								_status: "published",
							},
						],
						totalPages: 2,
					}
		})
		const rows = await collectPublicationInventory(
			{ db: { find } } as never,
			"2026-01-01T00:00:00.000Z"
		)
		expect(rows).toHaveLength(2)
		expect(rows.map((row) => row.plan.decision)).toEqual(["review", "update"])
		expect(rows.map((row) => row.hasChangedSinceCutoff)).toEqual([true, false])
		expect(find).toHaveBeenCalledWith(
			expect.objectContaining({
				collection: "posts",
				projection: expect.objectContaining({ _id: true, status: true }),
				limit: 200,
			})
		)
	})

	it("keeps new native publications and reviews changed legacy conflicts", async () => {
		const find = vi.fn(async ({ collection }: { collection: string }) => ({
			docs:
				collection === "pages"
					? [
							{
								id: "new",
								createdAt: "2026-02-01T00:00:00.000Z",
								updatedAt: "2026-02-02T00:00:00.000Z",
								status: "draft",
								_status: "published",
							},
							{
								id: "changed",
								createdAt: "2025-01-01T00:00:00.000Z",
								updatedAt: "2026-02-02T00:00:00.000Z",
								status: "draft",
								_status: "published",
							},
						]
					: [],
			totalPages: 1,
		}))
		const rows = await collectPublicationInventory(
			{ db: { find } } as never,
			"2026-01-01T00:00:00.000Z"
		)
		expect(rows.map((row) => [row.id, row.plan.decision])).toEqual([
			["new", "keep"],
			["changed", "review"],
		])
		expect(rows.map((row) => row.hasChangedSinceCutoff)).toEqual([true, true])
	})

	it("requires an explicit cutoff", async () => {
		await expect(
			collectPublicationInventory({ db: { find: vi.fn() } } as never, "unknown")
		).rejects.toThrow("cutoff")
	})

	it("reviews legacy public media when a newer draft version exists", async () => {
		const find = vi.fn(async ({ collection }: { collection: string }) => ({
			docs:
				collection === "media"
					? [{ id: "image-1", createdAt: "2025-01-01T00:00:00.000Z", _status: "draft" }]
					: [],
			totalPages: 1,
		}))
		const findVersions = vi.fn(async () => ({ docs: [{ version: { _status: "draft" } }] }))
		const rows = await collectPublicationInventory(
			{ db: { find, findVersions } } as never,
			"2026-01-01T00:00:00.000Z"
		)
		expect(rows[0]).toMatchObject({
			collection: "media",
			hasNewerDraft: true,
			plan: { decision: "review" },
		})
		expect(findVersions).toHaveBeenCalledWith(
			expect.objectContaining({ where: { parent: { equals: "image-1" } }, limit: 1 })
		)
	})
})
