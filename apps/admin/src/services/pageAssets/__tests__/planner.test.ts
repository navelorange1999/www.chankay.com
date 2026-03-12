import { describe, expect, it } from "vitest"

import { resolveQueuedPageAssetPlan } from "@/services/pageAssets/planner"

describe("pageAssets planner", () => {
	it("queues preview blocks that need a generated image", () => {
		const plan = resolveQueuedPageAssetPlan({
			doc: {
				id: "page-1",
				seo: {},
				structure: [
					{
						blockType: "previewUrl",
						id: "block-1",
						previewStatus: "idle",
						previewUrl: "https://example.com/demo",
						waitForMs: 1500,
					},
				],
			},
			previousDoc: null,
		})

		expect(plan.hasWork).toBe(true)
		expect(plan.queuedPreviewBlocks).toBe(1)
		expect(plan.structure?.[0]?.previewStatus).toBe("queued")
	})

	it("does not queue unchanged preview blocks with an existing image", () => {
		const plan = resolveQueuedPageAssetPlan({
			doc: {
				id: "page-1",
				seo: {},
				structure: [
					{
						blockType: "previewUrl",
						id: "block-1",
						previewImage: "media-1",
						previewStatus: "ready",
						previewUrl: "https://example.com/demo",
						waitForMs: 1500,
					},
				],
			},
			previousDoc: {
				id: "page-1",
				seo: {},
				structure: [
					{
						blockType: "previewUrl",
						id: "block-1",
						previewImage: "media-1",
						previewStatus: "ready",
						previewUrl: "https://example.com/demo",
						waitForMs: 1500,
					},
				],
			},
		})

		expect(plan.hasWork).toBe(false)
		expect(plan.queuedPreviewBlocks).toBe(0)
	})

	it("queues OG generation when auto generation is enabled", () => {
		const plan = resolveQueuedPageAssetPlan({
			doc: {
				id: "page-1",
				seo: {
					autoGenerateOgImage: true,
					ogGenerationStatus: "ready",
				},
				slug: "home",
				structure: [],
			},
			previousDoc: null,
		})

		expect(plan.hasWork).toBe(true)
		expect(plan.queuedOg).toBe(true)
		expect(plan.seo?.ogGenerationStatus).toBe("queued")
	})
})
