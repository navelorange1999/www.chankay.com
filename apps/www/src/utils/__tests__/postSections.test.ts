import { describe, expect, it } from "vitest"

import {
	getPostSection,
	isPostInSection,
	POST_SECTIONS,
	resolveLegacyPostPath,
	resolvePostSectionPath,
	type SectionablePost,
} from "../postSections"

function createPost(primaryTag?: SectionablePost["primaryTag"]): SectionablePost {
	return { primaryTag }
}

describe("post sections", () => {
	it("defines the technical and trading section descriptors", () => {
		expect(POST_SECTIONS).toEqual({
			technical: { domain: "technical", tagSlug: "technical" },
			trading: { domain: "trading", tagSlug: "trading" },
		})
	})

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

	it("matches posts only when their populated primary tag belongs to the requested section", () => {
		expect(isPostInSection(createPost({ id: "trading-id", slug: "trading" }), "trading")).toBe(true)
		expect(isPostInSection(createPost({ id: "trading-id", slug: "trading" }), "technical")).toBe(
			false
		)
		expect(isPostInSection(createPost("trading-id"), "trading")).toBe(false)
		expect(isPostInSection(createPost(), "technical")).toBe(true)
		expect(isPostInSection(createPost(null), "technical")).toBe(true)
	})

	it("resolves localized section index and detail paths", () => {
		expect(resolvePostSectionPath("technical")).toBe("/technical")
		expect(resolvePostSectionPath("technical", null, "en")).toBe("/technical")
		expect(resolvePostSectionPath("trading", "market-view", "zh-CN")).toBe(
			"/zh-CN/trading/market-view"
		)
	})

	it("does not construct detail paths for unsafe post slugs", () => {
		expect(resolvePostSectionPath("technical", " .. ", "en")).toBeNull()
		expect(resolvePostSectionPath("trading", "market-view", "en")).toBe("/trading/market-view")
	})

	it("resolves legacy post paths from the post primary tag", () => {
		expect(
			resolveLegacyPostPath(createPost({ id: "trading-id", slug: "trading" }), "market-view", "en")
		).toBe("/trading/market-view")
		expect(resolveLegacyPostPath(createPost(null), "architecture", "zh-CN")).toBe(
			"/zh-CN/technical/architecture"
		)
		expect(
			resolveLegacyPostPath(createPost({ id: "other-id", slug: "other" }), "unknown", "en")
		).toBeNull()
	})

	it("does not resolve legacy paths for unsafe slugs", () => {
		expect(resolveLegacyPostPath(createPost(null), "../private", "en")).toBeNull()
		expect(resolveLegacyPostPath(createPost(null), " .. ", "en")).toBeNull()
		expect(resolveLegacyPostPath(createPost(null), " market-view", "en")).toBeNull()
		expect(resolveLegacyPostPath(createPost(null), "market\u0085view", "en")).toBeNull()
	})
})
