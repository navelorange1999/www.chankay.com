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

	it.each([true, false])(
		"invalidates every locale when post comments change to %s",
		async (enabled) => {
			const hook = createRevalidationHook("posts", ["commentsEnabled"])
			await hook({
				doc: { _status: "published", slug: "example", commentsEnabled: enabled },
				previousDoc: { commentsEnabled: !enabled },
				req: { locale: "en" },
			} as never)
			expect(readRequestBody()).toEqual({ collection: "posts", slugs: ["example"] })
		}
	)

	it.each(["enabled", "repo", "repoId", "category", "categoryId"])(
		"invalidates every locale when the global Giscus %s changes",
		async (field) => {
			const hook = createGlobalRevalidationHook("site-config", ["giscus"])
			await hook({
				doc: { giscus: { [field]: "new-value" } },
				previousDoc: { giscus: { [field]: "old-value" } },
				req: { locale: "zh-CN" },
			} as never)
			expect(readRequestBody()).toEqual({ collection: "site-config", slugs: [] })
		}
	)

	it("keeps localized edits scoped when shared comment settings are unchanged", async () => {
		const hook = createGlobalRevalidationHook("site-config", ["giscus"])
		await hook({
			doc: { siteName: "New title", giscus: { enabled: true } },
			previousDoc: { siteName: "Old title", giscus: { enabled: true } },
			req: { locale: "en" },
		} as never)
		expect(readRequestBody()).toEqual({ collection: "site-config", slugs: [], locales: ["en"] })
	})

	it("invalidates every locale when publishing an autosaved comments change", async () => {
		const hook = createRevalidationHook("posts", ["commentsEnabled"])
		await hook({
			doc: { _status: "published", slug: "example", commentsEnabled: false },
			previousDoc: { _status: "draft", commentsEnabled: false },
			req: { locale: "en" },
		} as never)
		expect(readRequestBody()).toEqual({ collection: "posts", slugs: ["example"] })
	})
})
