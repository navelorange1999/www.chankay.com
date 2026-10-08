import { afterEach, describe, expect, it, vi } from "vitest"

import { sendWebsiteRevalidation } from "../task"

afterEach(() => {
	vi.unstubAllEnvs()
	vi.unstubAllGlobals()
})

describe("website revalidation task", () => {
	it("uses the canonical website origin when no callback URL is configured", async () => {
		vi.stubEnv("WWW_INTERNAL_SECRET", "1")
		vi.stubEnv("WWW_SITE_URL", "")
		const fetchMock = vi.fn(async () => ({ ok: true }))
		vi.stubGlobal("fetch", fetchMock)
		await sendWebsiteRevalidation({ collection: "pages", slugs: ["/"] })
		expect(fetchMock).toHaveBeenCalledWith(
			new URL("/api/revalidate", "https://chankay.com"),
			expect.objectContaining({ method: "POST" })
		)
	})
	it("delivers queued locale scoping to the website", async () => {
		vi.stubEnv("WWW_INTERNAL_SECRET", "1")
		const fetchMock = vi.fn(async () => ({ ok: true }))
		vi.stubGlobal("fetch", fetchMock)
		await sendWebsiteRevalidation({ collection: "posts", slugs: ["live"], locales: ["en"] })
		expect(fetchMock).toHaveBeenCalledWith(
			expect.any(URL),
			expect.objectContaining({
				body: JSON.stringify({ collection: "posts", slugs: ["live"], locales: ["en"] }),
			})
		)
	})
	it("rejects malformed locale data before sending a request", async () => {
		const fetchMock = vi.fn()
		vi.stubGlobal("fetch", fetchMock)
		await expect(
			sendWebsiteRevalidation({ collection: "posts", slugs: [], locales: ["invalid"] } as never)
		).rejects.toThrow("Invalid revalidation locales")
		expect(fetchMock).not.toHaveBeenCalled()
	})
	it("delivers a published change through the existing internal endpoint", async () => {
		vi.stubEnv("WWW_INTERNAL_SECRET", "1")
		vi.stubEnv("WWW_SITE_URL", "https://example.test")
		const fetchMock = vi.fn(async () => ({ ok: true }))
		vi.stubGlobal("fetch", fetchMock)

		await sendWebsiteRevalidation({ collection: "pages", slugs: ["new-live", "old-live"] })

		expect(fetchMock).toHaveBeenCalledWith(
			new URL("/api/revalidate", "https://example.test"),
			expect.objectContaining({
				body: JSON.stringify({ collection: "pages", slugs: ["new-live", "old-live"] }),
				method: "POST",
				signal: expect.any(AbortSignal),
			})
		)
	})

	it("throws on a failed endpoint response so Payload retries the job", async () => {
		vi.stubEnv("WWW_INTERNAL_SECRET", "1")
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => ({ ok: false, status: 503 }))
		)

		await expect(sendWebsiteRevalidation({ collection: "posts", slugs: ["live"] })).rejects.toThrow(
			"Frontend revalidation failed (503)"
		)
	})

	it("keeps the job pending when the endpoint credential is unavailable", async () => {
		vi.stubEnv("WWW_INTERNAL_SECRET", "")
		const fetchMock = vi.fn()
		vi.stubGlobal("fetch", fetchMock)

		await expect(sendWebsiteRevalidation({ collection: "posts", slugs: ["live"] })).rejects.toThrow(
			"Website revalidation is not configured"
		)
		expect(fetchMock).not.toHaveBeenCalled()
	})
})
