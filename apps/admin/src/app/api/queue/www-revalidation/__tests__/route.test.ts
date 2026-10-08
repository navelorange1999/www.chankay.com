import { beforeEach, describe, expect, it, vi } from "vitest"

const { handleCallbackMock, getPayloadMock, processJobMock } = vi.hoisted(() => ({
	handleCallbackMock: vi.fn(),
	getPayloadMock: vi.fn(),
	processJobMock: vi.fn(),
}))

vi.mock("@vercel/queue", () => ({ handleCallback: handleCallbackMock }))
vi.mock("payload", () => ({ getPayload: getPayloadMock }))
vi.mock("@payload-config", () => ({ default: Promise.resolve({}) }))
vi.mock("@/services/revalidation/worker", () => ({
	processCommittedRevalidationJob: processJobMock,
}))

describe("revalidation queue callback", () => {
	beforeEach(() => {
		vi.resetModules()
		handleCallbackMock.mockReset()
		getPayloadMock.mockReset()
		processJobMock.mockReset()
		handleCallbackMock.mockImplementation((handler) => async (request: Request) => {
			await handler(await request.json())
			return new Response(null, { status: 204 })
		})
	})

	it("runs a committed job through the platform verified callback", async () => {
		const payload = { jobs: {} }
		getPayloadMock.mockResolvedValue(payload)
		const { POST } = await import("../route")
		const response = await POST(
			new Request("http://localhost/api/queue/www-revalidation", {
				method: "POST",
				body: JSON.stringify({ jobId: "0123456789abcdef01234567" }),
			})
		)

		expect(handleCallbackMock).toHaveBeenCalledOnce()
		expect(response.status).toBe(204)
		expect(processJobMock).toHaveBeenCalledWith(payload, "0123456789abcdef01234567")
	})

	it("rejects a malformed job identifier", async () => {
		const { POST } = await import("../route")
		await expect(
			POST(
				new Request("http://localhost/api/queue/www-revalidation", {
					method: "POST",
					body: JSON.stringify({ jobId: "../jobs" }),
				})
			)
		).rejects.toThrow("Invalid revalidation queue message")
		expect(getPayloadMock).not.toHaveBeenCalled()
	})
})
