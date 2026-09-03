import { afterEach, describe, expect, it, vi } from "vitest"

import { PayloadClient } from "../payloadClient"

describe("PayloadClient", () => {
	afterEach(() => {
		vi.unstubAllGlobals()
	})

	it("serializes nested and/or collection filters", async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			new Response(JSON.stringify({ docs: [], totalDocs: 0, limit: 100, page: 1 }), {
				status: 200,
			})
		)
		vi.stubGlobal("fetch", fetchMock)
		const client = new PayloadClient("https://cms.example.com/api")

		await client.getCollection("posts", {
			where: {
				and: [
					{ status: { equals: "published" } },
					{
						or: [{ primaryTag: { equals: "technical-id" } }, { primaryTag: { exists: false } }],
					},
				],
			},
		})

		expect(fetchMock).toHaveBeenCalledWith(
			"https://cms.example.com/api/posts?where%5Band%5D%5B0%5D%5Bstatus%5D%5Bequals%5D=published&where%5Band%5D%5B1%5D%5Bor%5D%5B0%5D%5BprimaryTag%5D%5Bequals%5D=technical-id&where%5Band%5D%5B1%5D%5Bor%5D%5B1%5D%5BprimaryTag%5D%5Bexists%5D=false",
			expect.objectContaining({ method: "GET" })
		)
	})
})
