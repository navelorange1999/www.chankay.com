import { afterEach, describe, expect, it, vi } from "vitest"

import { validatePostPublication } from "../validatePostPublication"
import { getPublicationWhere } from "@/services/publicationCompatibility"

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
	it("allows authenticated journal-verified rollback to a legacy null category only during compatibility", async () => {
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
		await expect(validatePostPublication(input)).resolves.toEqual(input.data)
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
	it("defers a missing Category only for an existing pre-cutoff Post during compatibility", async () => {
		vi.stubEnv("CONTENT_PUBLICATION_MODE", "compatibility")
		vi.stubEnv("CONTENT_PUBLICATION_LEGACY_BEFORE", "2026-10-08T00:00:00.000Z")
		const input = args({ _status: "published" }, new Set())
		input.originalDoc = { id: "existing", createdAt: "2020-01-01T00:00:00.000Z" }
		await expect(validatePostPublication(input)).resolves.toEqual(input.data)
		input.operation = "create"
		await expect(validatePostPublication(input)).rejects.toThrow("requires a category")
		input.operation = "update"
		input.originalDoc = { id: "new", createdAt: "2026-10-08T00:00:00.000Z" }
		await expect(validatePostPublication(input)).rejects.toThrow("requires a category")
	})

	it("checks selected relationships against stored native state or the bounded legacy fallback", async () => {
		vi.stubEnv("CONTENT_PUBLICATION_MODE", "compatibility")
		vi.stubEnv("CONTENT_PUBLICATION_LEGACY_BEFORE", "2026-10-08T00:00:00.000Z")
		const find = vi.fn().mockResolvedValue({ docs: [{ id: "tag" }] })
		const input = {
			data: { _status: "published", tags: ["tag"] },
			originalDoc: { id: "existing", createdAt: "2020-01-01T00:00:00.000Z" },
			req: { payload: { find } },
		}
		await expect(validatePostPublication(input as never)).resolves.toEqual(input.data)
		expect(find).toHaveBeenCalledWith(
			expect.objectContaining({
				collection: "tags",
				draft: false,
				req: input.req,
				where: { and: [{ id: { equals: "tag" } }, getPublicationWhere("tags")] },
			})
		)
		find.mockResolvedValue({ docs: [] })
		await expect(validatePostPublication(input as never)).rejects.toThrow("tags references")
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

	it("rejects unpublished selected Tags while accepting published references", async () => {
		const data = { _status: "published", category: "category", tags: ["tag", "tag"] }
		await expect(validatePostPublication(args(data, new Set(["category"])))).rejects.toThrow(
			"tags references"
		)
		await expect(
			validatePostPublication(args(data, new Set(["category", "tag"])))
		).resolves.toEqual(data)
	})
})
