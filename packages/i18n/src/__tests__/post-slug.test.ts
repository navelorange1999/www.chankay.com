import { describe, expect, it } from "vitest"

import { POST_SLUG_MAX_LENGTH, isSafePostSlug, validatePostSlug } from "../post-slug.js"

describe("post slug validation", () => {
	it("accepts legitimate hyphenated post slugs", () => {
		expect(isSafePostSlug("market-view-2026")).toBe(true)
		expect(validatePostSlug("market-view-2026")).toBe(true)
	})

	it("accepts a slug at the maximum supported length", () => {
		const slug = "a".repeat(POST_SLUG_MAX_LENGTH)

		expect(isSafePostSlug(slug)).toBe(true)
		expect(validatePostSlug(slug)).toBe(true)
	})

	it("rejects a slug longer than the maximum supported length", () => {
		const slug = "a".repeat(POST_SLUG_MAX_LENGTH + 1)

		expect(isSafePostSlug(slug)).toBe(false)
		expect(validatePostSlug(slug)).toMatch(/safe URL path segment/i)
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
