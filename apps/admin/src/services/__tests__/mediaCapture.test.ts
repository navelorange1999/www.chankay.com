import type { PayloadRequest } from "payload"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { SKIP_MEDIA_SOURCE_CAPTURE_FLAG } from "@/services/pageAssets/constants"
import {
	mediaCaptureBeforeOperation,
	prepareMediaSourceCapture,
	resolveMediaCapturePlan,
	validateCaptureUrl,
} from "@/services/mediaCapture"
import { captureScreenshot } from "@/services/pageAssets/capture"

vi.mock("@/services/pageAssets/capture", () => ({
	captureScreenshot: vi.fn(),
}))

describe("mediaCapture", () => {
	beforeEach(() => {
		vi.mocked(captureScreenshot).mockReset()
	})

	it("validates capture URLs as https only", () => {
		expect(validateCaptureUrl("https://example.com")).toBe(true)
		expect(validateCaptureUrl("http://example.com")).toBe("Capture URL must use https://")
		expect(validateCaptureUrl("not-a-url")).toBe("Capture URL must be a valid URL")
	})

	it("does not regenerate when capture settings are unchanged on update", () => {
		expect(
			resolveMediaCapturePlan({
				data: {
					captureUrl: "https://example.com",
					captureWaitForMs: 1500,
				},
				hasUploadedFile: false,
				operation: "update",
				originalDoc: {
					captureUrl: "https://example.com",
					captureWaitForMs: 1500,
					filename: "existing.png",
				},
			}).shouldGenerate
		).toBe(false)
	})

	it("rejects mixed manual uploads and capture URLs", () => {
		expect(() =>
			resolveMediaCapturePlan({
				data: {
					captureUrl: "https://example.com",
				},
				hasUploadedFile: true,
				operation: "create",
			})
		).toThrow("Choose either a file upload or a Capture URL.")
	})

	it("injects a generated screenshot into req.file", async () => {
		vi.mocked(captureScreenshot).mockResolvedValue({
			buffer: Buffer.from("image"),
			contentType: "image/png",
			height: 900,
			width: 1600,
		})

		const req = {
			payload: {
				logger: {
					info: vi.fn(),
				},
			},
		} as unknown as PayloadRequest

		await prepareMediaSourceCapture({
			data: {
				captureUrl: "https://example.com",
				captureWaitForMs: 1200,
			},
			operation: "create",
			req,
		})

		expect(captureScreenshot).toHaveBeenCalledWith({
			height: 900,
			logger: req.payload.logger,
			url: "https://example.com",
			waitForTimeoutMs: 1200,
			width: 1600,
		})
		expect(req.file?.mimetype).toBe("image/png")
		expect(req.file?.size).toBe(5)
		expect(req.file?.name).toMatch(/^capture-https-example-com-/)
	})

	it("skips media URL capture when the skip flag is present", async () => {
		const args = {
			data: {
				captureUrl: "https://example.com",
			},
		}

		const req = {
			context: {
				[SKIP_MEDIA_SOURCE_CAPTURE_FLAG]: true,
			},
			payload: {
				logger: {
					info: vi.fn(),
				},
			},
		} as unknown as PayloadRequest

		const result = await mediaCaptureBeforeOperation({
			args,
			operation: "create",
			req,
		} as Parameters<typeof mediaCaptureBeforeOperation>[0])

		expect(result).toBe(args)
		expect(captureScreenshot).not.toHaveBeenCalled()
	})
})
