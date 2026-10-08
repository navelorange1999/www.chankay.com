import { afterEach, describe, expect, it, vi } from "vitest"

const { revalidateTag, revalidatePath, getBySlug } = vi.hoisted(() => ({
	revalidateTag: vi.fn(),
	revalidatePath: vi.fn(),
	getBySlug: vi.fn(async () => ({ id: "post-1" })),
}))

vi.mock("next/cache", () => ({ revalidateTag, revalidatePath }))
vi.mock("@/utils/payloadClient", () => ({ payloadClient: { getBySlug } }))

import { POST } from "@/app/api/revalidate/route"
import { getPostBySlug } from "@/services/payload/posts"
import { getPageBySlug } from "@/services/payload/pages"

afterEach(() => {
	vi.unstubAllEnvs()
	vi.clearAllMocks()
})

describe("published relationship cache invalidation", () => {
	it("tags public Post detail fetches with a shared relationship dependency", async () => {
		await getPostBySlug("example", { locale: "en" })
		expect(getBySlug).toHaveBeenCalledWith(
			"posts",
			"example",
			expect.objectContaining({
				tags: expect.arrayContaining(["post:example:en", "post-relations:en"]),
			})
		)
	})

	it("tags public Page detail fetches with a shared media dependency", async () => {
		await getPageBySlug("home", { locale: "en" })
		expect(getBySlug).toHaveBeenCalledWith(
			"pages",
			"home",
			expect.objectContaining({
				tags: expect.arrayContaining(["page:home:en", "page-media:en"]),
			})
		)
	})

	it.each(["categories", "tags", "series", "media"])(
		"invalidates Post detail dependencies when published %s changes",
		async (collection) => {
			vi.stubEnv("WWW_INTERNAL_SECRET", "test-secret")
			const response = await POST(
				new Request("https://site.example/api/revalidate", {
					method: "POST",
					headers: { "www-internal-secret": "test-secret", "content-type": "application/json" },
					body: JSON.stringify({ collection }),
				})
			)
			expect(response.status).toBe(200)
			expect(revalidateTag).toHaveBeenCalledWith("post-relations:en")
			expect(revalidateTag).toHaveBeenCalledWith("post-relations:zh-CN")
			if (collection === "media") {
				expect(revalidateTag).toHaveBeenCalledWith("page-media:en")
				expect(revalidateTag).toHaveBeenCalledWith("global:site-config:en")
			}
		}
	)
})
