import { describe, expect, it } from "vitest"

import { getPostSection, resolvePostSectionPath, type SectionablePost } from "../postSections"

function createPost(primaryTag?: SectionablePost["primaryTag"]): SectionablePost {
	return { primaryTag }
}

describe("post sections", () => {
	it("recognizes populated technical and trading primary tags", () => {
		expect(getPostSection(createPost({ id: 1, slug: " technical " }))).toBe("technical")
		expect(getPostSection(createPost({ id: "2", slug: "TRADING" }))).toBe("trading")
	})

	it("defaults a missing primary tag to technical", () => {
		expect(getPostSection(createPost())).toBe("technical")
		expect(getPostSection(createPost(null))).toBe("technical")
	})

	it("returns null for string IDs and unrecognized tag slugs", () => {
		expect(getPostSection(createPost("technical"))).toBeNull()
		expect(getPostSection(createPost({ id: 1, slug: "other" }))).toBeNull()
	})

	it("resolves localized section index and detail paths", () => {
		expect(resolvePostSectionPath("technical")).toBe("/technical")
		expect(resolvePostSectionPath("trading", "market-view", "zh-CN")).toBe(
			"/zh-CN/trading/market-view"
		)
	})
})
