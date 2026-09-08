import { beforeEach, describe, expect, it, vi } from "vitest"
import type { PayloadRequest } from "payload"
vi.mock("../../shared", () => ({
	createTextResult: (data: unknown) => ({
		content: [{ type: "text", text: JSON.stringify(data) }],
	}),
}))
vi.mock("@/services/socialPublishing", () => ({
	prepareSocialPublication: vi.fn(),
	createSocialDraft: vi.fn(),
	publishSocialPublication: vi.fn(),
}))
import { socialPublicationTools } from "../index"
import { prepareSocialPublication, publishSocialPublication } from "@/services/socialPublishing"
import { mcpCollections } from "../../collections"

beforeEach(() => vi.clearAllMocks())
describe("social MCP contract", () => {
	it("offers find-only native discovery", () => {
		for (const slug of ["social-accounts", "social-publications"] as const)
			expect(mcpCollections[slug].enabled).toEqual({
				find: true,
				create: false,
				update: false,
				delete: false,
			})
	})
	it("rejects arbitrary content before calling the shared service", async () => {
		const result = await socialPublicationTools[0]!.handler(
			{ accountId: "a", postId: "p", locale: "zh-CN", content: "Untrusted article" },
			{} as PayloadRequest
		)
		expect(result).toHaveProperty("isError", true)
		expect(prepareSocialPublication).not.toHaveBeenCalled()
	})
	it("forwards the authenticated request to the publication command", async () => {
		const req = { user: { id: "u" } } as PayloadRequest
		const args = { publicationId: "p", expectedSnapshotHash: "a".repeat(64) }
		vi.mocked(publishSocialPublication).mockResolvedValue({ status: "publish_queued" } as never)
		await socialPublicationTools[2]!.handler(args, req)
		expect(publishSocialPublication).toHaveBeenCalledWith(args, req)
		expect(socialPublicationTools[2]!.description).toContain("explicit confirmation")
	})
	it("does not expose underlying exceptions", async () => {
		vi.mocked(prepareSocialPublication).mockRejectedValue(new Error("private transport detail"))
		const result = await socialPublicationTools[0]!.handler(
			{ accountId: "a", postId: "p", locale: "en" },
			{} as PayloadRequest
		)
		expect(JSON.stringify(result)).not.toContain("private transport detail")
	})
})
