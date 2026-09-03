import { describe, expect, it } from "vitest"

import { postUnprefixedPath } from "../sitemap"

describe("post sitemap paths", () => {
	it("emits Technical, Trading, and legacy fallback paths", () => {
		expect(postUnprefixedPath({ primaryTag: null }, "legacy")).toBe("/technical/legacy")
		expect(
			postUnprefixedPath({ primaryTag: { id: "trading-id", slug: "trading" } }, "market-view")
		).toBe("/trading/market-view")
	})

	it("omits posts with an unknown primary section", () => {
		expect(
			postUnprefixedPath({ primaryTag: { id: "other-id", slug: "other" } }, "other")
		).toBeNull()
	})

	it("omits posts with an unsafe slug", () => {
		expect(postUnprefixedPath({ primaryTag: null }, "../private")).toBeNull()
		expect(postUnprefixedPath({ primaryTag: null }, " . ")).toBeNull()
		expect(postUnprefixedPath({ primaryTag: null }, "market-view ")).toBeNull()
		expect(postUnprefixedPath({ primaryTag: null }, "market\u0085view")).toBeNull()
	})
})
