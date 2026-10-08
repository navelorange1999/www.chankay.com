import { afterEach, describe, expect, it, vi } from "vitest"

import { validatePostPublication } from "../validatePostPublication"

afterEach(() => vi.unstubAllEnvs())

function args(data: Record<string, unknown>, publishedIds: Set<string>) {
	const findByID = vi.fn(async ({ id }: { id: string }) => ({
		_status: publishedIds.has(id) ? "published" : "draft",
	}))
	return {
		data,
		originalDoc: {},
		req: { payload: { findByID } },
	} as unknown as Parameters<typeof validatePostPublication>[0]
}

describe("validatePostPublication", () => {
	it("rejects a legacy null category even with obsolete rollback context", async () => {
		vi.stubEnv("CONTENT_PUBLICATION_MODE", "compatibility")
		vi.stubEnv("CONTENT_PUBLICATION_LEGACY_BEFORE", "2026-10-08T00:00:00.000Z")
		const input = args({ _status: "published", category: null }, new Set())
		input.originalDoc = {
			id: "existing",
			category: "category",
			createdAt: "2020-01-01T00:00:00.000Z",
		}
		input.req.context = { contentMigrationRollback: true }
		await expect(validatePostPublication(input)).rejects.toThrow("requires a category")
		input.req.user = { id: "editor" } as never
		await expect(validatePostPublication(input)).rejects.toThrow("requires a category")
		input.req.context = {}
		await expect(validatePostPublication(input)).rejects.toThrow("requires a category")
		input.req.context = { contentMigrationRollback: true }
		vi.stubEnv("CONTENT_PUBLICATION_MODE", "native")
		await expect(validatePostPublication(input)).rejects.toThrow("requires a category")
	})
	it("rejects draft SEO images on publication", async () => {
		const input = args(
			{ _status: "published", category: "category", meta: { image: "seo-image" } },
			new Set(["category"])
		)
		await expect(validatePostPublication(input)).rejects.toThrow("media references")
	})
	it("validates the retained SEO image when only other metadata is edited", async () => {
		const input = args(
			{ _status: "published", category: "category", meta: { title: "New title" } },
			new Set(["category"])
		)
		input.originalDoc = { meta: { image: "draft-image", title: "Old title" } }
		await expect(validatePostPublication(input)).rejects.toThrow("media references")
	})
	it("accepts a published SEO image and explicit removal of a previous draft image", async () => {
		const input = args(
			{ _status: "published", category: "category", meta: { image: "seo-image" } },
			new Set(["category", "seo-image"])
		)
		await expect(validatePostPublication(input)).resolves.toEqual(input.data)
		input.originalDoc = { meta: { image: "draft-image" } }
		input.data.meta = { image: null }
		await expect(validatePostPublication(input)).resolves.toEqual(input.data)
	})
	it("does not validate a removed Category using the previous relationship", async () => {
		const input = args({ _status: "published", category: null }, new Set(["category"]))
		input.originalDoc = {
			id: "existing",
			category: "category",
			createdAt: "2020-01-01T00:00:00.000Z",
		}
		await expect(validatePostPublication(input)).rejects.toThrow("requires a category")
		vi.stubEnv("CONTENT_PUBLICATION_MODE", "compatibility")
		vi.stubEnv("CONTENT_PUBLICATION_LEGACY_BEFORE", "2026-10-08T00:00:00.000Z")
		await expect(validatePostPublication(input)).rejects.toThrow("requires a category")
	})
	it("requires a Category for pre-cutoff Posts even with obsolete compatibility settings", async () => {
		vi.stubEnv("CONTENT_PUBLICATION_MODE", "compatibility")
		vi.stubEnv("CONTENT_PUBLICATION_LEGACY_BEFORE", "2026-10-08T00:00:00.000Z")
		const input = args({ _status: "published" }, new Set())
		input.originalDoc = { id: "existing", createdAt: "2020-01-01T00:00:00.000Z" }
		await expect(validatePostPublication(input)).rejects.toThrow("requires a category")
	})

	it("rejects relationships without native publication despite obsolete compatibility settings", async () => {
		vi.stubEnv("CONTENT_PUBLICATION_MODE", "compatibility")
		vi.stubEnv("CONTENT_PUBLICATION_LEGACY_BEFORE", "2026-10-08T00:00:00.000Z")
		const input = args(
			{ _status: "published", category: "category", series: "series" },
			new Set(["category"])
		)
		await expect(validatePostPublication(input)).rejects.toThrow("series references")
		expect(input.req.payload.findByID).toHaveBeenCalledWith(
			expect.objectContaining({ draft: false, req: input.req })
		)
	})

	it("allows incomplete draft autosaves", async () => {
		await expect(
			validatePostPublication(args({ _status: "draft" }, new Set()))
		).resolves.toMatchObject({ _status: "draft" })
	})

	it("requires a published Category before a Post can be published", async () => {
		await expect(
			validatePostPublication(args({ _status: "published" }, new Set()))
		).rejects.toThrow("requires a category")
		await expect(
			validatePostPublication(args({ _status: "published", category: "draft" }, new Set()))
		).rejects.toThrow("categories references")
	})

	it("does not query retired Tags when legacy data still contains tag relationships", async () => {
		const data = { _status: "published", category: "category", tags: ["retired-tag"] }
		const input = args(data, new Set(["category"]))
		await expect(validatePostPublication(input)).resolves.toEqual(data)
		expect(input.req.payload.findByID).toHaveBeenCalledTimes(1)
	})
})
