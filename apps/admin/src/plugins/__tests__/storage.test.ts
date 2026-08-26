import { describe, expect, it, vi } from "vitest"

const { vercelBlobStorageMock } = vi.hoisted(() => {
	Reflect.set(process.env, "VERCEL_BLOB_READ_WRITE_TOKEN", "")
	Reflect.set(process.env, "VERCEL_BLOB_PUBLIC_BASE_URL", "")
	Reflect.set(process.env, "NEXT_PUBLIC_SERVER_URL", "")

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
