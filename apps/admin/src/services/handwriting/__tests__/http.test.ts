import { describe, expect, it, vi } from "vitest"
import { createPreviewHandler, canEditHandwriting } from "../http"

const request = (body: unknown, origin = "https://admin.example.com") =>
	new Request("https://admin.example.com/api/handwriting/preview", {
		method: "POST",
		headers: { origin, "content-type": "application/json" },
		body: JSON.stringify(body),
	})

describe("handwriting preview boundary", () => {
	it("requires an authenticated CMS editor before generating", async () => {
		const generate = vi.fn()
		const handler = createPreviewHandler({
			authorize: async () => false,
			generate,
			invalidate: vi.fn(),
		})
		expect((await handler(request({ text: "Hello" }))).status).toBe(401)
		expect(generate).not.toHaveBeenCalled()
		expect(canEditHandwriting({ collection: "users", role: "editor" })).toBe(true)
		expect(canEditHandwriting({ collection: "users", role: "viewer" })).toBe(false)
	})
	it("rejects a cross-origin preview request", async () => {
		const generate = vi.fn()
		const handler = createPreviewHandler({
			authorize: async () => true,
			generate,
			invalidate: vi.fn(),
		})
		expect((await handler(request({ text: "Hello" }, "https://other.example.com"))).status).toBe(
			403
		)
		expect(generate).not.toHaveBeenCalled()
	})

	it("returns the cached server artifact without saving a page", async () => {
		const artifact = { fingerprint: "a".repeat(64), text: "Hello" }
		const generate = vi.fn().mockResolvedValue(artifact)
		const invalidate = vi.fn()
		const handler = createPreviewHandler({ authorize: async () => true, generate, invalidate })
		const response = await handler(request({ text: "Hello" }))
		expect(response.status).toBe(200)
		expect(response.headers.get("cache-control")).toBe("no-store")
		expect(await response.json()).toEqual(artifact)
		expect(invalidate).toHaveBeenCalledWith([artifact.fingerprint])
	})

	it("rejects invalid English and oversized input before generation", async () => {
		const generate = vi.fn()
		const handler = createPreviewHandler({
			authorize: async () => true,
			generate,
			invalidate: vi.fn(),
		})
		for (const text of ["你好", "Hello\nworld", "x".repeat(9000)]) {
			expect((await handler(request({ text }))).status).toBe(400)
		}
		expect(generate).not.toHaveBeenCalled()
	})
})
