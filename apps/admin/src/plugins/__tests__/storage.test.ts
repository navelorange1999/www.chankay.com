import { describe, expect, it, vi } from "vitest"

const { vercelBlobStorageMock } = vi.hoisted(() => {
	return {
		vercelBlobStorageMock: vi.fn(() => vi.fn()),
	}
})

vi.mock("@payloadcms/storage-vercel-blob", () => ({
	vercelBlobStorage: vercelBlobStorageMock,
}))

vi.mock("@/plugins/mcp", () => ({
	payloadMcpPlugin: vi.fn(),
}))

import "@/plugins"

describe("plugins", () => {
	it("always inserts Vercel Blob fields during schema generation", () => {
		expect(vercelBlobStorageMock).toHaveBeenCalledWith(
			expect.objectContaining({
				alwaysInsertFields: true,
			})
		)
	})
})
