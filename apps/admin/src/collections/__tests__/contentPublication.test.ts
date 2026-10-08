import { afterEach, describe, expect, it, vi } from "vitest"

vi.mock("@/services/pageAssets", () => ({ syncPageGeneratedAssets: vi.fn() }))
vi.mock("@/services/mediaCapture", () => ({
	mediaCaptureBeforeOperation: vi.fn(),
	validateCaptureUrl: vi.fn(() => true),
}))

import { Categories } from "../Categories"
import { Media } from "../Media"
import { Pages } from "../Pages"
import { Posts } from "../Posts"
import { Series } from "../Series"
import { Tags } from "../Tags"
import { rejectStalePageAssetUpdate } from "@/services/pageAssets/versionGuard"

afterEach(() => vi.unstubAllEnvs())

const collections = [Posts, Pages, Tags, Series, Media, Categories]

describe("content publication schemas", () => {
	it("removes legacy status and primaryTag schema fields", () => {
		const primaryTag = Posts.fields.find((field) => "name" in field && field.name === "primaryTag")
		expect(primaryTag).toBeUndefined()
		for (const collection of [Posts, Pages, Series])
			expect(collection.fields.some((field) => "name" in field && field.name === "status")).toBe(
				false
			)
	})
	it("captures the public main snapshot before deleting every content collection", () => {
		for (const collection of collections)
			expect(collection.hooks?.beforeDelete?.length).toBeGreaterThan(0)
	})
	it("ignores obsolete compatibility configuration", () => {
		vi.stubEnv("CONTENT_PUBLICATION_MODE", "compatibility")
		vi.stubEnv("CONTENT_PUBLICATION_LEGACY_BEFORE", "2026-10-08T00:00:00.000Z")
		for (const collection of collections) {
			const read = collection.access?.read
			expect(read?.({ req: { user: null } } as never)).toEqual({ _status: { equals: "published" } })
		}
	})
	it("enables native drafts on every content collection", () => {
		for (const collection of collections) {
			expect(
				collection.versions && typeof collection.versions === "object" && collection.versions.drafts
			).toBeTruthy()
		}
	})

	it("uses native publication access for anonymous readers", () => {
		for (const collection of collections) {
			const read = collection.access?.read
			expect(typeof read).toBe("function")
			if (typeof read !== "function") continue
			expect(read({ req: { user: null } } as never)).toEqual({ _status: { equals: "published" } })
			const readVersions = collection.access?.readVersions
			expect(typeof readVersions).toBe("function")
			if (typeof readVersions === "function") {
				expect(readVersions({ req: { user: null } } as never)).toBe(false)
				expect(readVersions({ req: { user: { id: "editor" } } } as never)).toBe(true)
			}
		}
	})

	it("keeps progress independent of publication and adds reverse joins", () => {
		expect(Series.fields.some((field) => "name" in field && field.name === "progress")).toBe(true)
		expect(
			Series.fields.find((field) => "name" in field && field.name === "status")
		).toBeUndefined()
		for (const collection of [Categories, Tags, Series]) {
			expect(
				collection.fields.some(
					(field) => "name" in field && field.name === "posts" && field.type === "join"
				)
			).toBe(true)
		}
		expect(Posts.fields.some((field) => "name" in field && field.name === "category")).toBe(true)
	})

	it("checks a generated Page version in the collection write path", () => {
		expect(Pages.hooks?.beforeChange).toContain(rejectStalePageAssetUpdate)
	})
})
