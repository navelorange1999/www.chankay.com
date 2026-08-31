import { randomUUID } from "node:crypto"

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { createGlobalRevalidationHook, createRevalidationHook } from "../revalidateWww"

const fetchMock = vi.fn<typeof fetch>()

function readRequestBody(): Record<string, unknown> {
	const request = fetchMock.mock.calls.at(-1)?.[1]
	return JSON.parse(String(request?.body)) as Record<string, unknown>
}

describe("www revalidation hooks", () => {
	beforeEach(() => {
		vi.stubEnv("WWW_INTERNAL_SECRET", randomUUID())
		vi.stubEnv("WWW_SITE_URL", "https://www.example.com")
		vi.stubGlobal("fetch", fetchMock)
		fetchMock.mockReset()
		fetchMock.mockResolvedValue(new Response(null, { status: 200 }))
	})

	afterEach(() => {
		vi.unstubAllEnvs()
		vi.unstubAllGlobals()
	})

	it("forwards a supported collection locale", async () => {
		const hook = createRevalidationHook("posts")

		await hook({
			doc: { _status: "published", slug: "example" },
			previousDoc: {},
			req: { locale: "zh-CN" },
		} as never)

		expect(readRequestBody()).toEqual({
			collection: "posts",
			locales: ["zh-CN"],
			slugs: ["example"],
		})
	})

	it.each(["all", "unsupported", undefined])(
		"keeps all-locale fallback for collection locale %s",
		async (locale) => {
			const hook = createRevalidationHook("posts")

			await hook({
				doc: { _status: "published", slug: "example" },
				previousDoc: {},
				req: { locale },
			} as never)

			expect(readRequestBody()).toEqual({
				collection: "posts",
				slugs: ["example"],
			})
		}
	)

	it("forwards a supported global locale", async () => {
		const hook = createGlobalRevalidationHook("site-config")

		await hook({
			doc: {},
			req: { locale: "en" },
		} as never)

		expect(readRequestBody()).toEqual({
			collection: "site-config",
			locales: ["en"],
			slugs: [],
		})
	})
})
