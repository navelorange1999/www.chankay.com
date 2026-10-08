import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const {
	findByID,
	findGlobal,
	updatePageWithGenerationContext,
	captureScreenshot,
	persistGeneratedMedia,
} = vi.hoisted(() => ({
	findByID: vi.fn(),
	findGlobal: vi.fn(),
	updatePageWithGenerationContext: vi.fn(),
	captureScreenshot: vi.fn(),
	persistGeneratedMedia: vi.fn(),
}))

vi.mock("@/services/pageAssets/state", () => ({
	createPageAssetsRuntime: async () => ({
		payload: { findByID, findGlobal },
		logger: { info: vi.fn(), error: vi.fn() },
	}),
	updatePageWithGenerationContext,
}))
vi.mock("@/services/pageAssets/capture", () => ({ captureScreenshot, persistGeneratedMedia }))

import { processPageAssetsJob } from "../processor"

const queued = {
	id: "page-1",
	updatedAt: "2026-09-29T01:00:00.000Z",
	seo: {},
	structure: [
		{
			id: "preview-1",
			blockType: "previewUrl",
			previewUrl: "https://example.com",
			previewStatus: "queued",
		},
	],
}

describe("page asset version guard", () => {
	afterEach(() => vi.unstubAllEnvs())

	beforeEach(() => {
		findByID.mockReset()
		findGlobal.mockReset()
		updatePageWithGenerationContext.mockReset()
		captureScreenshot.mockReset()
		persistGeneratedMedia.mockReset()
	})

	it("ignores a queued job after the Page version changes", async () => {
		findByID.mockResolvedValue({ ...queued, updatedAt: "2026-09-29T02:00:00.000Z" })
		await processPageAssetsJob({ pageId: "page-1", expectedUpdatedAt: queued.updatedAt })
		expect(updatePageWithGenerationContext).not.toHaveBeenCalled()
		expect(captureScreenshot).not.toHaveBeenCalled()
	})

	it("ignores a job when handwriting preparation observes a newer save", async () => {
		findByID
			.mockResolvedValueOnce(queued)
			.mockResolvedValueOnce({ ...queued, updatedAt: "2026-09-29T02:00:00.000Z" })
		updatePageWithGenerationContext.mockResolvedValue({ ...queued, structure: [], seo: {} })
		await processPageAssetsJob({ pageId: "page-1", expectedUpdatedAt: queued.updatedAt })
		expect(updatePageWithGenerationContext).not.toHaveBeenCalled()
		expect(captureScreenshot).not.toHaveBeenCalled()
	})

	it("does not attach a screenshot after a concurrent editor save", async () => {
		findByID
			.mockResolvedValueOnce(queued)
			.mockResolvedValueOnce(queued)
			.mockResolvedValueOnce({ ...queued, updatedAt: "2026-09-29T03:00:00.000Z", structure: [] })
		updatePageWithGenerationContext.mockResolvedValue({
			...queued,
			updatedAt: "2026-09-29T02:00:00.000Z",
			structure: [{ ...queued.structure[0], previewStatus: "generating" }],
		})
		captureScreenshot.mockResolvedValue({
			buffer: Buffer.from("image"),
			contentType: "image/png",
			width: 100,
			height: 100,
		})
		persistGeneratedMedia.mockResolvedValue({ id: "generated-1" })
		await processPageAssetsJob({ pageId: "page-1", expectedUpdatedAt: queued.updatedAt })
		expect(captureScreenshot).toHaveBeenCalledOnce()
		expect(updatePageWithGenerationContext).toHaveBeenCalledTimes(1)
	})

	it("does not attach an OG image after a concurrent editor save", async () => {
		vi.stubEnv("WWW_INTERNAL_SECRET", "test-secret")
		const queuedOg = {
			...queued,
			slug: "home",
			seo: { autoGenerateOgImage: true, ogGenerationStatus: "queued" },
			structure: [],
		}
		findByID
			.mockResolvedValueOnce(queuedOg)
			.mockResolvedValueOnce(queuedOg)
			.mockResolvedValueOnce({ ...queuedOg, updatedAt: "2026-09-29T03:00:00.000Z", seo: {} })
		findGlobal.mockResolvedValue({ siteUrl: "https://site.example" })
		updatePageWithGenerationContext.mockResolvedValue({
			...queuedOg,
			updatedAt: "2026-09-29T02:00:00.000Z",
			seo: { autoGenerateOgImage: true, ogGenerationStatus: "generating" },
		})
		captureScreenshot.mockResolvedValue({
			buffer: Buffer.from("image"),
			contentType: "image/png",
			width: 100,
			height: 100,
		})
		persistGeneratedMedia.mockResolvedValue({ id: "generated-og" })
		await processPageAssetsJob({ pageId: "page-1", expectedUpdatedAt: queued.updatedAt })
		expect(captureScreenshot).toHaveBeenCalledOnce()
		expect(updatePageWithGenerationContext).toHaveBeenCalledTimes(1)
	})
})
