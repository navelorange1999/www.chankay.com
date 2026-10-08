import { describe, expect, it } from "vitest"

import { postUnprefixedPath } from "../sitemap"

describe("post sitemap paths", () => {
	it("emits Technical, Trading, and legacy fallback paths", () => {
		expect(postUnprefixedPath({ category: null }, "legacy")).toBe("/posts/legacy")
		expect(
			postUnprefixedPath(
				{ category: { id: "trading-id", slug: "trading", _status: "published" } },
				"market-view"
			)
		).toBe("/trading/market-view")
	})

	it("keeps other categories on the generic article route", () => {
		expect(
			postUnprefixedPath(
				{ category: { id: "other-id", slug: "other", _status: "published" } },
				"other"
			)
		).toBe("/posts/other")
	})

	it("omits posts with an unsafe slug", () => {
		expect(postUnprefixedPath({ category: null }, "../private")).toBeNull()
		expect(postUnprefixedPath({ category: null }, " . ")).toBeNull()
		expect(postUnprefixedPath({ category: null }, "market-view ")).toBeNull()
		expect(postUnprefixedPath({ category: null }, "market\u0085view")).toBeNull()
	})
})
