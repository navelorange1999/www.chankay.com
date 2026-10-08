import { describe, expect, it } from "vitest"

import { buildTaxonomyManifest, planTaxonomyRollback } from "../manifest"
import type { TaxonomyInventoryRow } from "../inventory"

const row: TaxonomyInventoryRow = {
	id: "post-1",
	updatedAt: "2026-01-01T00:00:00.000Z",
	legacyStatus: "published",
	nativeStatus: "published",
	current: {
		id: "post-1",
		category: null,
		primaryTag: "classification",
		tags: ["classification", "react"],
	},
	plan: { id: "post-1", category: "technical", tags: ["react"], changed: true },
}

describe("taxonomy migration manifest", () => {
	it("records only the relationship fields that change", () => {
		const manifest = buildTaxonomyManifest([row])
		expect(manifest.actions).toEqual([
			{
				id: "post-1",
				expected: {
					updatedAt: row.updatedAt,
					category: null,
					primaryTag: "classification",
					tags: ["classification", "react"],
				},
				target: { category: "technical", tags: ["react"] },
			},
		])
	})

	it("blocks conflicting editorial decisions", () => {
		const manifest = buildTaxonomyManifest([
			row,
			{ ...row, id: "post-2", plan: { ...row.plan, reviewReason: "Conflict" } },
		])
		expect(manifest.actions).toEqual([])
		expect(manifest.blocked).toEqual([{ id: "post-2", reason: "Conflict" }])
	})

	it("requires a current timestamp even when a Post needs no relationship change", () => {
		expect(buildTaxonomyManifest([{ ...row, updatedAt: null, plan: { ...row.plan, changed: false } }]).blocked)
			.toEqual([{ id: "post-1", reason: "A current timestamp is required." }])
	})

	it("requires explicit acceptance before leaving a public Post uncategorized", () => {
		const uncategorized = {
			...row,
			id: "post-3",
			current: { ...row.current, id: "post-3", primaryTag: null },
			plan: { id: "post-3", category: null, tags: ["react"], changed: false },
		}
		expect(buildTaxonomyManifest([uncategorized]).blocked).toEqual([
			{
				id: "post-3",
				reason: "A public Post needs a Category or explicit Uncategorized acceptance.",
			},
		])
		expect(buildTaxonomyManifest([uncategorized], new Set(["post-3"])).blocked).toEqual([])
		expect(
			buildTaxonomyManifest([{ ...uncategorized, legacyStatus: "draft", nativeStatus: "draft" }])
				.blocked
		).toEqual([])
	})

	it("refuses rollback after a later edit", () => {
		const action = buildTaxonomyManifest([row]).actions[0]!
		expect(
			planTaxonomyRollback(action, "2026-01-02T00:00:00.000Z", {
				updatedAt: "2026-01-03T00:00:00.000Z",
				category: "technical",
				tags: ["react"],
			}).decision
		).toBe("conflict")
		expect(
			planTaxonomyRollback(action, "2026-01-02T00:00:00.000Z", {
				updatedAt: "2026-01-02T00:00:00.000Z",
				category: "technical",
				tags: ["react"],
			})
		).toEqual({
			decision: "restore",
			target: { category: null, tags: ["classification", "react"] },
		})
	})
})
