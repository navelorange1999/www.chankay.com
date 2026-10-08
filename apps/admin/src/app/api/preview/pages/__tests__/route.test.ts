import { randomUUID } from "node:crypto"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
const { find, getPayloadMock } = vi.hoisted(() => ({ find: vi.fn(), getPayloadMock: vi.fn() }))
vi.mock("payload", () => ({ getPayload: getPayloadMock }))
vi.mock("@payload-config", () => ({ default: Promise.resolve({}) }))
import { GET } from "../route"
let previewSecret: string
beforeEach(() => {
	previewSecret = randomUUID()
	vi.stubEnv("WWW_INTERNAL_SECRET", previewSecret)
	find.mockReset().mockResolvedValue({ docs: [{ id: "home", slug: "/", _status: "draft" }] })
	getPayloadMock.mockReset().mockResolvedValue({ find })
})
afterEach(() => vi.unstubAllEnvs())
function request(slug: string, authorized = true) {
	const url = new URL("https://cms.example/api/preview/pages")
	url.searchParams.set("slug", slug)
	url.searchParams.set("locale", "en")
	return new Request(url, { headers: authorized ? { "www-internal-secret": previewSecret } : {} })
}
describe("authorized Page preview", () => {
	it("loads the root Page as an uncached native draft", async () => {
		const response = await GET(request("/"))
		expect(response.status).toBe(200)
		expect(response.headers.get("Cache-Control")).toBe("private, no-store")
		expect(find).toHaveBeenCalledWith(
			expect.objectContaining({
				collection: "pages",
				draft: true,
				locale: "en",
				where: { slug: { equals: "/" } },
			})
		)
	})
	it("requires server authorization before reading drafts", async () => {
		expect((await GET(request("/", false))).status).toBe(401)
		expect(find).not.toHaveBeenCalled()
	})
	it.each(["../private", "/../private", "//", "", "a?b"])(
		"rejects an invalid slug %s",
		async (slug) => {
			expect((await GET(request(slug))).status).toBe(400)
			expect(find).not.toHaveBeenCalled()
		}
	)
})
