import { beforeEach, describe, expect, it, vi } from "vitest"

const sendMock = vi.fn()

vi.mock("@vercel/queue", () => ({
	send: sendMock,
}))

vi.mock("@/services/pageAssets/processor", () => ({
	processPageAssetsJob: vi.fn(),
}))

describe("pageAssets dispatcher", () => {
	const env = process.env as Record<string, string | undefined>
	const originalNodeEnv = process.env.NODE_ENV
	const originalVercel = process.env.VERCEL

	beforeEach(() => {
		vi.resetModules()
		sendMock.mockReset()
		sendMock.mockResolvedValue({
			messageId: "msg-1",
		})
		env.NODE_ENV = originalNodeEnv
		if (originalVercel) {
			env.VERCEL = originalVercel
		} else {
			delete process.env.VERCEL
		}
	})

	it("dispatches queue jobs on deployed Vercel runtimes", async () => {
		env.NODE_ENV = "production"
		env.VERCEL = "1"

		const { enqueuePageAssetsJob } = await import("@/services/pageAssets/dispatcher")

		await enqueuePageAssetsJob({
			pageId: "page-1",
			expectedUpdatedAt: "2026-09-29T00:00:00.000Z",
		})

		expect(sendMock).toHaveBeenCalledWith("page-assets", {
			pageId: "page-1",
			expectedUpdatedAt: "2026-09-29T00:00:00.000Z",
		})
	})

	it("runs inline jobs during development", async () => {
		env.NODE_ENV = "development"
		delete process.env.VERCEL

		const { enqueuePageAssetsJob } = await import("@/services/pageAssets/dispatcher")
		const { processPageAssetsJob } = await import("@/services/pageAssets/processor")

		await enqueuePageAssetsJob({
			pageId: "page-2",
			expectedUpdatedAt: "2026-09-29T00:00:00.000Z",
		})

		await vi.waitFor(() => {
			expect(vi.mocked(processPageAssetsJob)).toHaveBeenCalledWith({
				pageId: "page-2",
				expectedUpdatedAt: "2026-09-29T00:00:00.000Z",
			})
		})
		expect(sendMock).not.toHaveBeenCalled()
	})

	it("falls back to inline jobs outside Vercel", async () => {
		env.NODE_ENV = "production"
		delete process.env.VERCEL

		const { enqueuePageAssetsJob } = await import("@/services/pageAssets/dispatcher")
		const { processPageAssetsJob } = await import("@/services/pageAssets/processor")

		await enqueuePageAssetsJob({
			pageId: "page-3",
			expectedUpdatedAt: "2026-09-29T00:00:00.000Z",
		})

		await vi.waitFor(() => {
			expect(vi.mocked(processPageAssetsJob)).toHaveBeenCalledWith({
				pageId: "page-3",
				expectedUpdatedAt: "2026-09-29T00:00:00.000Z",
			})
		})
		expect(sendMock).not.toHaveBeenCalled()
	})
})
