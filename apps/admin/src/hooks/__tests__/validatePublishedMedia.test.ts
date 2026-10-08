import { afterEach, describe, expect, it, vi } from "vitest"

import { validatePagePublication, validateSiteConfigMedia } from "../validatePublishedMedia"
import { getPublicationWhere } from "@/services/publicationCompatibility"

afterEach(() => vi.unstubAllEnvs())

function request(status: "draft" | "published") {
	const findByID = vi.fn(async () => ({ _status: status }))
	return { req: { payload: { findByID } }, findByID }
}

describe("published media references", () => {
	it("allows legacy media through the bounded compatibility predicate for Pages and Site Config", async () => {
		vi.stubEnv("CONTENT_PUBLICATION_MODE", "compatibility")
		vi.stubEnv("CONTENT_PUBLICATION_LEGACY_BEFORE", "2026-10-08T12:00:00.000Z")
		const find = vi.fn().mockResolvedValue({ docs: [{ id: "legacy-image" }] })
		const req = { payload: { find } }
		await validatePagePublication({
			data: { _status: "published", seo: { ogImage: "legacy-image" } },
			req,
		} as never)
		await validateSiteConfigMedia({ data: { logo: "legacy-image" }, req } as never)
		expect(find).toHaveBeenCalledTimes(2)
		expect(find).toHaveBeenCalledWith(
			expect.objectContaining({
				collection: "media",
				draft: false,
				req,
				where: { and: [{ id: { equals: "legacy-image" } }, getPublicationWhere("media")] },
			})
		)
		find.mockResolvedValue({ docs: [] })
		await expect(
			validateSiteConfigMedia({ data: { logo: "private-image" }, req } as never)
		).rejects.toThrow("logo")
	})

	it("shares the write transaction and propagates database failures in strict mode", async () => {
		const { req, findByID } = request("published")
		await validateSiteConfigMedia({ data: { logo: "logo" }, req } as never)
		expect(findByID).toHaveBeenCalledWith(expect.objectContaining({ req, disableErrors: true }))
		findByID.mockRejectedValue(new Error("Database unavailable"))
		await expect(validateSiteConfigMedia({ data: { logo: "logo" }, req } as never)).rejects.toThrow(
			"Database unavailable"
		)
	})
	it("blocks a Page with a nested draft image", async () => {
		const { req } = request("draft")
		await expect(
			validatePagePublication({
				data: {
					_status: "published",
					structure: [
						{ blockType: "container", children: [{ blockType: "mediaImage", media: "image-1" }] },
					],
				},
				originalDoc: {},
				req,
			} as never)
		).rejects.toThrow("structure.0.children.0.media")
	})

	it("checks images nested inside Card content", async () => {
		const { req } = request("draft")
		await expect(
			validatePagePublication({
				data: {
					_status: "published",
					structure: [
						{ blockType: "card", contentBlocks: [{ blockType: "mediaImage", media: "image-2" }] },
					],
				},
				originalDoc: {},
				req,
			} as never)
		).rejects.toThrow("structure.0.contentBlocks.0.media")
	})

	it("keeps existing SEO image checks on partial updates", async () => {
		const { req } = request("draft")
		await expect(
			validatePagePublication({
				data: { _status: "published", seo: { metaTitle: "Updated" } },
				originalDoc: { seo: { ogImage: "draft-og" } },
				req,
			} as never)
		).rejects.toThrow("seo.ogImage")
	})

	it("allows draft Page edits without inspecting media", async () => {
		const { req, findByID } = request("draft")
		await validatePagePublication({ data: { _status: "draft" }, originalDoc: {}, req } as never)
		expect(findByID).not.toHaveBeenCalled()
	})

	it("checks Site Config assets on save", async () => {
		const { req } = request("draft")
		await expect(
			validateSiteConfigMedia({ data: { logo: "logo-1" }, originalDoc: {}, req } as never)
		).rejects.toThrow("logo")
	})
})
