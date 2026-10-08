import { describe, expect, it } from "vitest"

import { buildPublicationManifest, planPublicationRollback } from "../manifest"
import type { PublicationInventoryRow } from "../inventory"

function row(overrides: Partial<PublicationInventoryRow> = {}): PublicationInventoryRow {
	return {
		collection: "media",
		id: "image-1",
		createdAt: "2025-01-01T00:00:00.000Z",
		updatedAt: "2026-01-01T00:00:00.000Z",
		hasChangedSinceCutoff: false,
		legacyStatus: null,
		nativeStatus: null,
		progress: null,
		hasNewerDraft: false,
		plan: { decision: "update", targetStatus: "published" },
		...overrides,
	}
}

describe("publication migration manifest", () => {
	it("creates a guarded dry-run action for a reconciled record", () => {
		const manifest = buildPublicationManifest([row()])
		expect(manifest.blocked).toEqual([])
		expect(manifest.actions).toEqual([
			{
				collection: "media",
				id: "image-1",
				expected: {
					updatedAt: "2026-01-01T00:00:00.000Z",
					nativeStatus: null,
					legacyStatus: null,
					progress: null,
				},
				target: { nativeStatus: "published" },
			},
		])
	})

	it("blocks the whole batch when a snapshot requires review or lacks an expected timestamp", () => {
		const manifest = buildPublicationManifest([
			row(),
			row({ id: "image-2", plan: { decision: "review", reason: "Newer draft" } }),
		])
		expect(manifest.actions).toEqual([])
		expect(manifest.blocked).toEqual([
			{ collection: "media", id: "image-2", reason: "Newer draft" },
		])
		expect(buildPublicationManifest([row({ updatedAt: null })]).blocked).toHaveLength(1)
		expect(buildPublicationManifest([row({ updatedAt: null, plan: { decision: "keep" } })]).blocked)
			.toHaveLength(1)
	})

	it("rolls back only while the migrated snapshot is still current", () => {
		const action = buildPublicationManifest([row()]).actions[0]!
		expect(
			planPublicationRollback(action, "2026-01-02T00:00:00.000Z", {
				updatedAt: "2026-01-02T00:00:00.000Z",
				nativeStatus: "published",
				progress: null,
			})
		).toEqual({ decision: "restore", target: { nativeStatus: null, progress: null } })
		expect(
			planPublicationRollback(action, "2026-01-02T00:00:00.000Z", {
				updatedAt: "2026-01-03T00:00:00.000Z",
				nativeStatus: "published",
				progress: null,
			}).decision
		).toBe("conflict")
	})
})
