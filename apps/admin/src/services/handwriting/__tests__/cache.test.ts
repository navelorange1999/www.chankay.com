import { describe, expect, it, vi } from "vitest"
import { createArtifactCache } from "../cache"

describe("handwriting artifact cache", () => {
	it("shares one generation across concurrent requests and later cache hits", async () => {
		const files = new Map<string, unknown>()
		const generate = vi.fn(async () => ({ fingerprint: "same", text: "Hello" }))
		const cache = createArtifactCache({
			read: async (key: string) => files.get(key) ?? null,
			write: async (key: string, value: unknown) => {
				files.set(key, value)
				return value
			},
			generate,
		})
		const [a, b] = await Promise.all([cache.ensure("same", {}), cache.ensure("same", {})])
		expect(a).toEqual(b)
		expect(await cache.ensure("same", {})).toEqual(a)
		expect(generate).toHaveBeenCalledTimes(1)
	})

	it("allows a failed generation to be retried without caching a partial result", async () => {
		const write = vi.fn(async (_key, value) => value)
		const generate = vi
			.fn()
			.mockRejectedValueOnce(new Error("Incomplete"))
			.mockResolvedValue({ text: "Hello" })
		const cache = createArtifactCache({ read: async () => null, write, generate })
		await expect(cache.ensure("same", {})).rejects.toThrow("Incomplete")
		expect(write).not.toHaveBeenCalled()
		await expect(cache.ensure("same", {})).resolves.toEqual({ text: "Hello" })
		expect(generate).toHaveBeenCalledTimes(2)
	})

	it("does not mistake a storage outage for a cache miss", async () => {
		const generate = vi.fn()
		const cache = createArtifactCache({
			read: async () => {
				throw new Error("Unavailable")
			},
			write: vi.fn(),
			generate,
		})
		await expect(cache.ensure("same", {})).rejects.toThrow("Unavailable")
		expect(generate).not.toHaveBeenCalled()
	})
})
