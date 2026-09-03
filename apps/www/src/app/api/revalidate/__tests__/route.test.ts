import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const { revalidatePath, revalidateTag } = vi.hoisted(() => ({
	revalidatePath: vi.fn(),
	revalidateTag: vi.fn(),
}))

vi.mock("next/cache", () => ({ revalidatePath, revalidateTag }))

import { POST } from "../route"

const TEST_SECRET = "test-only-revalidation-secret"

function requestFor(body: unknown, secret = TEST_SECRET): Request {
	return new Request("https://www.example.test/api/revalidate", {
		method: "POST",
		headers: {
			"content-type": "application/json",
			"www-internal-secret": secret,
		},
		body: JSON.stringify(body),
	})
}

describe("revalidation route", () => {
	beforeEach(() => {
		vi.stubEnv("WWW_INTERNAL_SECRET", TEST_SECRET)
		revalidatePath.mockReset()
		revalidateTag.mockReset()
	})

	afterEach(() => {
		vi.unstubAllEnvs()
	})

	it("revalidates both post section routes and cache tags", async () => {
		const response = await POST(
			requestFor({ collection: "posts", slugs: ["example"], locales: ["en"] })
		)

		expect(response.status).toBe(200)
		expect(revalidatePath).toHaveBeenCalledWith("/technical")
		expect(revalidatePath).toHaveBeenCalledWith("/trading")
		expect(revalidatePath).toHaveBeenCalledWith("/technical/example")
		expect(revalidatePath).toHaveBeenCalledWith("/trading/example")
		expect(revalidateTag).toHaveBeenCalledWith("posts:section:technical:en")
		expect(revalidateTag).toHaveBeenCalledWith("posts:section:trading:en")
	})

	it("revalidates both section archives and tag cache entries after tag changes", async () => {
		const response = await POST(requestFor({ collection: "tags", locales: ["en"] }))

		expect(response.status).toBe(200)
		expect(revalidatePath).toHaveBeenCalledWith("/technical")
		expect(revalidatePath).toHaveBeenCalledWith("/trading")
		expect(revalidateTag).toHaveBeenCalledWith("posts:section:technical:en")
		expect(revalidateTag).toHaveBeenCalledWith("posts:section:trading:en")
		expect(revalidateTag).toHaveBeenCalledWith("tag:technical:en")
		expect(revalidateTag).toHaveBeenCalledWith("tag:trading:en")
	})

	it("rejects requests without the configured secret", async () => {
		const response = await POST(requestFor({ collection: "posts" }, "wrong-test-secret"))

		expect(response.status).toBe(401)
		expect(revalidatePath).not.toHaveBeenCalled()
		expect(revalidateTag).not.toHaveBeenCalled()
	})

	it("does not revalidate article paths for unsafe post slugs", async () => {
		const response = await POST(
			requestFor({
				collection: "posts",
				slugs: ["../private", " . ", "market-view ", "market\u0085view"],
				locales: ["en"],
			})
		)

		expect(response.status).toBe(200)
		expect(revalidatePath).not.toHaveBeenCalledWith("/technical/../private")
		expect(revalidatePath).not.toHaveBeenCalledWith("/trading/../private")
		expect(revalidatePath).not.toHaveBeenCalledWith("/technical/ . ")
		expect(revalidatePath).not.toHaveBeenCalledWith("/trading/market-view ")
		expect(revalidatePath).not.toHaveBeenCalledWith("/technical/market\u0085view")
		expect(revalidatePath).toHaveBeenCalledWith("/technical")
		expect(revalidatePath).toHaveBeenCalledWith("/trading")
	})
})
