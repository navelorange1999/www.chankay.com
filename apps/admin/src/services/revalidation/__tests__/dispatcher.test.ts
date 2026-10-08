import { afterEach, describe, expect, it, vi } from "vitest"

import { enqueueRevalidation } from "../dispatcher"

const sendMock = vi.hoisted(() => vi.fn())
vi.mock("@vercel/queue", () => ({ send: sendMock }))

afterEach(() => {
	vi.unstubAllEnvs()
	sendMock.mockReset()
})

describe("transactional revalidation enqueue", () => {
	it("stores a validated locale selection with the durable job", async () => {
		vi.stubEnv("VERCEL", "")
		const queue = vi.fn(async () => ({ id: "job" }))
		const req = { payload: { jobs: { queue } } }
		await enqueueRevalidation(req as never, "posts", ["live"], ["en", "en", "zh-CN"])
		expect(queue).toHaveBeenCalledWith(
			expect.objectContaining({
				input: { collection: "posts", slugs: ["live"], locales: ["en", "zh-CN"] },
				req,
			})
		)
	})
	it("rejects unsupported locale input before storing a job", async () => {
		const queue = vi.fn()
		await expect(
			enqueueRevalidation({ payload: { jobs: { queue } } } as never, "posts", [], [
				"invalid",
			] as never)
		).rejects.toThrow("Invalid revalidation locales")
		expect(queue).not.toHaveBeenCalled()
	})
	it("writes the job in the caller transaction and delays the Vercel wakeup", async () => {
		vi.stubEnv("VERCEL", "1")
		sendMock.mockResolvedValue({ messageId: "message-1" })
		const queue = vi.fn(async () => ({ id: "0123456789abcdef01234567" }))
		const req = { payload: { jobs: { queue } } }

		await enqueueRevalidation(req as never, "posts", ["live", "live", "old-live"])

		expect(queue).toHaveBeenCalledWith({
			task: "revalidateWww",
			queue: "www-revalidation",
			input: { collection: "posts", slugs: ["live", "old-live"] },
			req,
		})
		expect(sendMock).toHaveBeenCalledWith(
			"www-revalidation",
			{ jobId: "0123456789abcdef01234567" },
			{ delaySeconds: 5, idempotencyKey: "0123456789abcdef01234567" }
		)
	})

	it("rejects a failed wakeup so the content transaction can roll back", async () => {
		vi.stubEnv("VERCEL", "1")
		sendMock.mockRejectedValue(new Error("Queue unavailable"))
		const queue = vi.fn(async () => ({ id: "0123456789abcdef01234567" }))
		const req = { payload: { jobs: { queue } } }

		await expect(enqueueRevalidation(req as never, "posts", ["live"])).rejects.toThrow(
			"Queue unavailable"
		)
		expect(queue).toHaveBeenCalledOnce()
	})
})
