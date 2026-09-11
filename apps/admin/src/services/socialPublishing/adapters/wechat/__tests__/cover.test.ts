import { createHash, randomBytes } from "node:crypto"
import sharp from "sharp"
import { describe, expect, it } from "vitest"
import { prepareCoverUpload } from "../cover"

describe("cover upload optimization", () => {
	it("keeps a small cover unchanged", async () => {
		const asset = { bytes: new Uint8Array([1, 2, 3]), mimeType: "image/png" }
		expect(await prepareCoverUpload(asset)).toBe(asset)
	})
	it("bounds a large noisy cover while preserving its aspect ratio and original bytes", async () => {
		const bytes = await sharp(randomBytes(1800 * 1200 * 3), {
			raw: { width: 1800, height: 1200, channels: 3 },
		})
			.png()
			.toBuffer()
		const before = createHash("sha256").update(bytes).digest("hex")
		const optimized = await prepareCoverUpload({ bytes, mimeType: "image/png" })
		const metadata = await sharp(optimized.bytes).metadata()
		expect(optimized.bytes.byteLength).toBeLessThanOrEqual(500_000)
		expect(optimized.mimeType).toBe("image/jpeg")
		expect(metadata.format).toBe("jpeg")
		expect(metadata.width!).toBeLessThanOrEqual(1600)
		expect(metadata.width! / metadata.height!).toBeCloseTo(1.5, 2)
		expect(createHash("sha256").update(bytes).digest("hex")).toBe(before)
	})
	it("reports corrupt large images as a non-ambiguous local error", async () => {
		await expect(
			prepareCoverUpload({ bytes: new Uint8Array(600_000), mimeType: "image/png" })
		).rejects.toMatchObject({ stage: "media", code: "COVER_OPTIMIZATION", ambiguous: false })
	})
})
