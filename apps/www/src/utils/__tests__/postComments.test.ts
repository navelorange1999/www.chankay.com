import { describe, expect, it } from "vitest"

import { resolvePostComments } from "../postComments"

const post = { id: "post-123", status: "published" as const }
const settings = {
	enabled: true,
	repo: "navelorange1999/chankay-discussions",
	repoId: "R_kgDOUk_WeA",
	category: "Announcements",
	categoryId: "DIC_kwDOUk_WeM4DGIzk",
}

describe("post comments", () => {
	it("enables legacy posts and uses the immutable ID across slugs and translations", () => {
		const english = { ...post, title: "Original title", slug: "original" }
		const translated = { ...post, title: "Translated title", slug: "renamed" }
		expect(resolvePostComments(english, settings)?.term).toBe("post:post-123")
		expect(resolvePostComments(translated, settings)).toEqual(
			resolvePostComments(english, settings)
		)
		expect(resolvePostComments({ ...post, id: "post-124" }, settings)?.term).toBe("post:post-124")
	})

	it("does not render disabled or unpublished post discussions", () => {
		expect(resolvePostComments({ ...post, commentsEnabled: false }, settings)).toBeNull()
		expect(resolvePostComments({ ...post, status: "draft" }, settings)).toBeNull()
		expect(resolvePostComments({ ...post, _status: "draft" }, settings)).toBeNull()
		expect(resolvePostComments(post, { ...settings, enabled: false })).toBeNull()
	})

	it("fails closed when the integration is missing or malformed", () => {
		expect(resolvePostComments(post, undefined)).toBeNull()
		expect(resolvePostComments(post, { ...settings, repoId: "" })).toBeNull()
		expect(resolvePostComments(post, { ...settings, repo: "https://example.com" })).toBeNull()
		expect(resolvePostComments(post, { ...settings, repo: "owner/../repo" })).toBeNull()
		expect(resolvePostComments(post, { ...settings, categoryId: "invalid" })).toBeNull()
		expect(resolvePostComments({ ...post, id: "../bad" }, settings)).toBeNull()
	})
})
