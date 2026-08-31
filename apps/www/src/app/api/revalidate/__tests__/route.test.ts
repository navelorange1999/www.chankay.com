import { randomUUID } from "node:crypto"

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const { revalidatePath, revalidateTag } = vi.hoisted(() => ({
	revalidatePath: vi.fn(),
	revalidateTag: vi.fn(),
}))

vi.mock("next/cache", () => ({
	revalidatePath,
	revalidateTag,
}))

import { POST } from "../route"

describe("site-config revalidation", () => {
	let requestSecret: string

	beforeEach(() => {
		requestSecret = randomUUID()
		vi.stubEnv("WWW_INTERNAL_SECRET", requestSecret)
		revalidatePath.mockReset()
		revalidateTag.mockReset()
	})

	afterEach(() => {
		vi.unstubAllEnvs()
	})

	function createRequest(locale: "en" | "zh-CN") {
		return new Request("https://www.example.com/api/revalidate", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"www-internal-secret": requestSecret,
			},
			body: JSON.stringify({
				collection: "site-config",
				locales: [locale],
			}),
		})
	}

	it("revalidates only the Chinese layout path", async () => {
		const response = await POST(createRequest("zh-CN"))

		expect(response.status).toBe(200)
		expect(revalidatePath).toHaveBeenCalledWith("/zh-CN", "layout")
		expect(revalidatePath).not.toHaveBeenCalledWith("/", "layout")
		expect(revalidateTag).toHaveBeenCalledWith("global:site-config:zh-CN")
	})

	it("revalidates the unprefixed English layout path", async () => {
		const response = await POST(createRequest("en"))

		expect(response.status).toBe(200)
		expect(revalidatePath).toHaveBeenCalledWith("/", "layout")
		expect(revalidatePath).not.toHaveBeenCalledWith("/zh-CN", "layout")
		expect(revalidateTag).toHaveBeenCalledWith("global:site-config:en")
	})
})
