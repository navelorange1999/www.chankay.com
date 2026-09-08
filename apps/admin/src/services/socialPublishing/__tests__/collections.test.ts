import { afterEach, describe, expect, it, vi } from "vitest"
import { SocialAccounts } from "../../../collections/SocialAccounts"
import { trustedMediaURL, prepareSchema } from "../validation"

afterEach(() => vi.unstubAllEnvs())
describe("destination and source validation", () => {
	it("makes provider identity immutable", async () => {
		const hook = SocialAccounts.hooks!.beforeChange![0]!
		await expect(async () =>
			hook({
				operation: "update",
				originalDoc: { platform: "wechat-official-account", providerAccountId: "first" },
				data: { providerAccountId: "second" },
			} as never)
		).rejects.toThrow("immutable")
	})
	it("blocks deletion of an account with history", async () => {
		const hook = SocialAccounts.hooks!.beforeDelete![0]!
		await expect(
			hook({
				id: "account",
				req: { payload: { find: vi.fn(async () => ({ docs: [{ id: "publication" }] })) } },
			} as never)
		).rejects.toThrow("history")
	})
	it("restricts media to exact configured HTTPS origins and rejects redirects in URL syntax", () => {
		vi.stubEnv("NEXT_PUBLIC_SERVER_URL", "https://admin.example.com")
		vi.stubEnv("VERCEL_BLOB_PUBLIC_BASE_URL", "https://media.example.com")
		expect(trustedMediaURL("https://media.example.com/cover.jpg").origin).toBe(
			"https://media.example.com"
		)
		for (const url of [
			"http://media.example.com/cover.jpg",
			"https://media.example.com.evil.test/cover.jpg",
			"https://media.example.com/cover.jpg?redirect=1",
			"https://127.0.0.1/cover.jpg",
		])
			expect(() => trustedMediaURL(url)).toThrow()
	})
	it("rejects unsupported locales and object-shaped identifiers", () => {
		expect(
			prepareSchema.safeParse({ accountId: { $ne: null }, postId: "p", locale: "zh-CN" }).success
		).toBe(false)
		expect(prepareSchema.safeParse({ accountId: "a", postId: "p", locale: "fr" }).success).toBe(
			false
		)
	})
})
