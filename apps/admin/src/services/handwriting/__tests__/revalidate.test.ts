import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { revalidateHandwriting } from "../revalidate"

const fetchMock = vi.fn()
const keys = (count: number) =>
	Array.from({ length: count }, (_, index) => index.toString(16).padStart(64, "0"))
const sentKeys = () =>
	fetchMock.mock.calls.map(([, options]) => JSON.parse(options.body).fingerprints as string[])

beforeEach(() => {
	vi.stubEnv("WWW_INTERNAL_SECRET", "test-only-placeholder")
	vi.stubEnv("WWW_SITE_URL", "https://example.test")
	vi.stubGlobal("fetch", fetchMock)
	fetchMock.mockReset()
	// Match the website endpoint's request-size contract.
	fetchMock.mockImplementation(async (_url, options) =>
		Response.json({}, { status: JSON.parse(options.body).fingerprints.length <= 100 ? 200 : 400 })
	)
})
afterEach(() => {
	vi.unstubAllEnvs()
	vi.unstubAllGlobals()
})

describe("handwriting cache invalidation batches", () => {
	it.each([99, 100, 101, 201])("refreshes all %i keys within the endpoint limit", async (count) => {
		const input = keys(count)
		await expect(revalidateHandwriting(input)).resolves.toBeUndefined()
		const batches = sentKeys()
		expect(batches).toHaveLength(Math.ceil(count / 100))
		expect(batches.every((batch) => batch.length > 0 && batch.length <= 100)).toBe(true)
		expect(batches.flat()).toEqual(input)
	})

	it("deduplicates before batching", async () => {
		const input = keys(100)
		await revalidateHandwriting([...input, ...input])
		expect(sentKeys()).toEqual([input])
	})

	it("propagates a failed batch and lets a retry refresh every key", async () => {
		const input = keys(201)
		fetchMock
			.mockResolvedValueOnce(Response.json({}))
			.mockResolvedValueOnce(Response.json({}, { status: 503 }))
		await expect(revalidateHandwriting(input)).rejects.toThrow("Handwriting cache refresh failed")
		expect(fetchMock).toHaveBeenCalledTimes(2)
		fetchMock.mockClear()
		await expect(revalidateHandwriting(input)).resolves.toBeUndefined()
		expect(sentKeys().flat()).toEqual(input)
	})
})
