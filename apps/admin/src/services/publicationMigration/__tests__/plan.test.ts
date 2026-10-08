import { describe, expect, it } from "vitest"

import { planPublication } from "../plan"

describe("native publication reconciliation plan", () => {
	it("never publishes an exposed Post whose native snapshot is not already published", () => {
		for (const nativeStatus of [null, "draft"] as const) {
			expect(
				planPublication({
					collection: "posts",
					legacyStatus: "published",
					nativeStatus,
					isLegacyRecord: true,
				}).decision
			).toBe("review")
		}
	})

	it("removes hidden Posts from native public reads", () => {
		for (const legacyStatus of ["draft", "archived"]) {
			expect(
				planPublication({
					collection: "posts",
					legacyStatus,
					nativeStatus: "published",
					isLegacyRecord: true,
					hasChangedSinceCutoff: false,
				})
			).toMatchObject({ decision: "update", targetStatus: "draft" })
		}
	})

	it("treats native status as authoritative for records created after the cutoff", () => {
		for (const collection of ["posts", "pages"] as const) {
			expect(planPublication({
				collection,
				legacyStatus: "draft",
				nativeStatus: "published",
				isLegacyRecord: false,
			})).toEqual({ decision: "keep" })
			expect(planPublication({
				collection,
				legacyStatus: "draft",
				nativeStatus: null,
				isLegacyRecord: false,
			}).decision).toBe("review")
		}
	})

	it("requires review when a legacy-hidden record was modified after the cutoff", () => {
		for (const collection of ["posts", "pages"] as const) {
			expect(planPublication({
				collection,
				legacyStatus: "draft",
				nativeStatus: "published",
				isLegacyRecord: true,
				hasChangedSinceCutoff: true,
			}).decision).toBe("review")
		}
	})

	it("preserves previously public taxonomy and media while leaving new drafts alone", () => {
		for (const collection of ["tags", "media"] as const) {
			expect(
				planPublication({
					collection,
					nativeStatus: null,
					isLegacyRecord: true,
					hasNewerDraft: false,
				})
			).toMatchObject({ decision: "update", targetStatus: "published" })
			expect(
				planPublication({
					collection,
					nativeStatus: "draft",
					isLegacyRecord: true,
					hasNewerDraft: true,
				}).decision
			).toBe("review")
			expect(
				planPublication({ collection, nativeStatus: "draft", isLegacyRecord: false }).decision
			).toBe("keep")
		}
	})

	it("maps Series progress independently of publication", () => {
		expect(
			planPublication({
				collection: "series",
				legacyStatus: "draft",
				nativeStatus: null,
				isLegacyRecord: true,
				hasNewerDraft: false,
			})
		).toMatchObject({ decision: "update", targetStatus: "published", progress: "planned" })
		expect(
			planPublication({
				collection: "series",
				legacyStatus: "completed",
				nativeStatus: "draft",
				isLegacyRecord: false,
			})
		).toMatchObject({ decision: "keep" })
		expect(
			planPublication({
				collection: "series",
				legacyStatus: "completed",
				nativeStatus: "published",
				isLegacyRecord: true,
				currentProgress: "in-progress",
			}).decision
		).toBe("review")
		expect(
			planPublication({
				collection: "series",
				legacyStatus: "completed",
				nativeStatus: "published",
				isLegacyRecord: true,
				currentProgress: "completed",
			}).decision
		).toBe("keep")
	})

	it("does not publish a newer Page draft", () => {
		expect(
			planPublication({
				collection: "pages",
				legacyStatus: "published",
				nativeStatus: "draft",
				isLegacyRecord: true,
				hasNewerDraft: true,
			}).decision
		).toBe("review")
		expect(
			planPublication({
				collection: "pages",
				legacyStatus: "published",
				nativeStatus: null,
				isLegacyRecord: true,
			}).decision
		).toBe("review")
	})
})
