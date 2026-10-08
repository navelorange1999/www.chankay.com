import { afterEach, describe, expect, it, vi } from "vitest"

import { captureScreenshot } from "../capture"
import { buildGeneratedFilename } from "../utils"

describe("page asset capture privacy", () => {
	afterEach(() => {
		vi.unstubAllEnvs()
		vi.unstubAllGlobals()
	})

	it("does not record target URLs or service credentials", async () => {
		vi.stubEnv("PREVIEW_CAPTURE_API_URL", "https://capture.example/api?credential=endpoint-secret")
		vi.stubEnv("PREVIEW_CAPTURE_API_KEY", "api-secret")
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
				headers: new Headers({ "content-type": "image/png" }),
				arrayBuffer: async () => Uint8Array.from([1]).buffer,
			})
		)
		const info = vi.fn()
		const error = vi.fn()
		await captureScreenshot({
			height: 100,
			width: 100,
			url: "https://site.example/page?private=target-secret",
			logger: { info, error },
		})
		const logs = JSON.stringify([...info.mock.calls, ...error.mock.calls])
		expect(logs).not.toContain("endpoint-secret")
		expect(logs).not.toContain("api-secret")
		expect(logs).not.toContain("target-secret")
	})

	it("does not propagate an untrusted error body", async () => {
		vi.stubEnv("PREVIEW_CAPTURE_API_URL", "https://capture.example/api")
		vi.stubEnv("PREVIEW_CAPTURE_API_KEY", "api-secret")
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: false,
				status: 502,
				text: async () => "target-secret",
			})
		)
		const error = vi.fn()
		await expect(
			captureScreenshot({
				height: 100,
				width: 100,
				url: "https://site.example/page?private=target-secret",
				logger: { info: vi.fn(), error },
			})
		).rejects.toThrow("Preview capture failed (502)")
		expect(JSON.stringify(error.mock.calls)).not.toContain("target-secret")
	})

	it("keeps untrusted subjects out of generated filenames", () => {
		expect(
			buildGeneratedFilename("preview", "https://site.example/?private=target-secret", "image/png")
		).not.toContain("target-secret")
	})
})
