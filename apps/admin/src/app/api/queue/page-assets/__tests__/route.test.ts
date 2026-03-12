import { beforeEach, describe, expect, it, vi } from "vitest"
import { processPageAssetsJob } from "@/services/pageAssets/processor"

const handleCallbackMock = vi.fn()

vi.mock("@vercel/queue", () => ({
	handleCallback: handleCallbackMock,
}))

vi.mock("@/services/pageAssets/processor", () => ({
	processPageAssetsJob: vi.fn(),
}))

describe("page assets queue route", () => {
	beforeEach(() => {
		handleCallbackMock.mockReset()
		vi.mocked(processPageAssetsJob).mockReset()
	})

	it("passes queue messages to the page-assets processor", async () => {
		handleCallbackMock.mockImplementation((handler) => {
			return async (request: Request) => {
				const body = (await request.json()) as { pageId: string }
				await handler(body, {
					consumerGroup: "default",
					createdAt: new Date(),
					deliveryCount: 1,
					expiresAt: new Date(),
					messageId: "msg-1",
					region: "iad1",
					topicName: "page-assets",
				})
				return new Response(null, { status: 204 })
			}
		})

		const { POST } = await import("../route")
		const response = await POST(
			new Request("http://localhost/api/queue/page-assets", {
				body: JSON.stringify({
					pageId: "page-1",
				}),
				headers: {
					"Content-Type": "application/json",
				},
				method: "POST",
			})
		)

		expect(response.status).toBe(204)
		expect(vi.mocked(processPageAssetsJob)).toHaveBeenCalledWith({
			pageId: "page-1",
		})
	})
})
