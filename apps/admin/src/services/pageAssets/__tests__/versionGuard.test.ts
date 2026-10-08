import { describe, expect, it } from "vitest"

import { EXPECTED_PAGE_UPDATED_AT_CONTEXT_KEY, GENERATION_CONTEXT_FLAG } from "../constants"
import { rejectStalePageAssetUpdate } from "../versionGuard"

function input(expectedUpdatedAt: string | undefined, currentUpdatedAt: string) {
	return {
		data: { structure: [] },
		originalDoc: { updatedAt: currentUpdatedAt },
		req: {
			context: {
				[GENERATION_CONTEXT_FLAG]: true,
				...(expectedUpdatedAt ? { [EXPECTED_PAGE_UPDATED_AT_CONTEXT_KEY]: expectedUpdatedAt } : {}),
			},
		},
	} as never
}

describe("generated Page update version guard", () => {
	it("accepts a write for the exact Page version", () => {
		const args = input("2026-09-29T01:00:00.000Z", "2026-09-29T01:00:00.000Z")
		expect(rejectStalePageAssetUpdate(args)).toEqual({ structure: [] })
	})

	it("rejects stale or unguarded generated writes", () => {
		expect(() =>
			rejectStalePageAssetUpdate(input("2026-09-29T01:00:00.000Z", "2026-09-29T02:00:00.000Z"))
		).toThrow("Page changed before generated assets could be saved")
		expect(() => rejectStalePageAssetUpdate(input(undefined, "2026-09-29T02:00:00.000Z"))).toThrow(
			"Page changed before generated assets could be saved"
		)
	})

	it("does not affect ordinary editor writes", () => {
		const args = {
			data: { title: "Updated" },
			originalDoc: { updatedAt: "2026-09-29T02:00:00.000Z" },
			req: { context: {} },
		} as never
		expect(rejectStalePageAssetUpdate(args)).toEqual({ title: "Updated" })
	})
})
