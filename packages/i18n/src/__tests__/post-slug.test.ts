import { describe, expect, it } from "vitest"

import { isSafePostSlug, validatePostSlug } from "../post-slug.js"

describe("post slug validation", () => {
	it("accepts legitimate hyphenated post slugs", () => {
		expect(isSafePostSlug("market-view-2026")).toBe(true)
		expect(validatePostSlug("market-view-2026")).toBe(true)
	})

	it.each([
		"",
		"   ",
		".",
		"..",
		" . ",
		" .. ",
		" market-view",
		"market-view ",
		"market view",
		"market/view",
		"market\\view",
		"market?view",
		"market#view",
		"market\u0000view",
		"market\u0085view",
		"%2e%2e",
		"market%2fview",
		"market%252fview",
	])("rejects unsafe path segment %j", (slug) => {
		expect(isSafePostSlug(slug)).toBe(false)
		expect(validatePostSlug(slug)).toMatch(/safe URL path segment/i)
	})
})
