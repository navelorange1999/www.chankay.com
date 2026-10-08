import { describe, expect, it } from "vitest"

import {
	getPostSection,
	isPostInSection,
	POST_SECTIONS,
	resolveLegacyPostPath,
	resolvePostSectionPath,
	type SectionablePost,
} from "../postSections"

function createPost(category?: SectionablePost["category"]): SectionablePost {
	return { category }
}

describe("post sections", () => {
	it("defines the technical and trading section descriptors", () => {
		expect(POST_SECTIONS).toEqual({
			technical: { domain: "technical", categorySlug: "technical" },
			trading: { domain: "trading", categorySlug: "trading" },
		})
	})

	it("recognizes populated technical and trading categories", () => {
		expect(getPostSection(createPost({ id: 1, slug: " technical ", _status: "published" }))).toBe(
			"technical"
		)
		expect(getPostSection(createPost({ id: "2", slug: "TRADING", _status: "published" }))).toBe(
			"trading"
		)
	})

	it("does not classify posts without a published category", () => {
		expect(getPostSection(createPost())).toBeNull()
		expect(getPostSection(createPost(null))).toBeNull()
	})

	it("returns null for string IDs and unrecognized category slugs", () => {
		expect(getPostSection(createPost("technical"))).toBeNull()
		expect(getPostSection(createPost({ id: 1, slug: "other", _status: "published" }))).toBeNull()
	})

	it("matches posts only when their populated category belongs to the requested section", () => {
		expect(
			isPostInSection(
				createPost({ id: "trading-id", slug: "trading", _status: "published" }),
				"trading"
			)
		).toBe(true)
		expect(
			isPostInSection(
				createPost({ id: "trading-id", slug: "trading", _status: "published" }),
				"technical"
			)
		).toBe(false)
		expect(isPostInSection(createPost("trading-id"), "trading")).toBe(false)
		expect(isPostInSection(createPost(), "technical")).toBe(false)
		expect(isPostInSection(createPost(null), "technical")).toBe(false)
	})

	it("ignores a stale primary tag and withdrawn categories", () => {
		const post = {
			category: { id: "category-id", slug: "trading", _status: "published" as const },
			primaryTag: { id: "old-id", slug: "technical" },
		}
		expect(getPostSection(post)).toBe("trading")
		expect(getPostSection({ category: { ...post.category, _status: "draft" } })).toBeNull()
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

	it("resolves legacy post paths from the post category", () => {
		expect(
			resolveLegacyPostPath(
				createPost({ id: "trading-id", slug: "trading", _status: "published" }),
				"market-view",
				"en"
			)
		).toBe("/trading/market-view")
		expect(resolveLegacyPostPath(createPost(null), "architecture", "zh-CN")).toBe(
			"/zh-CN/posts/architecture"
		)
		expect(
			resolveLegacyPostPath(
				createPost({ id: "other-id", slug: "other", _status: "published" }),
				"unknown",
				"en"
			)
		).toBe("/posts/unknown")
	})

	it("does not resolve legacy paths for unsafe slugs", () => {
		expect(resolveLegacyPostPath(createPost(null), "../private", "en")).toBeNull()
		expect(resolveLegacyPostPath(createPost(null), " .. ", "en")).toBeNull()
		expect(resolveLegacyPostPath(createPost(null), " market-view", "en")).toBeNull()
		expect(resolveLegacyPostPath(createPost(null), "market\u0085view", "en")).toBeNull()
	})
})
