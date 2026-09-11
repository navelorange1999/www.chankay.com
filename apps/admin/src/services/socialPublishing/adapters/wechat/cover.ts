import { SocialPublishingError } from "../../types"

const uploadBudgetBytes = 500_000

// Optimize only the provider copy; the snapshotted CMS original stays unchanged.
export async function prepareCoverUpload(asset: { bytes: Uint8Array; mimeType: string }) {
	if (asset.bytes.byteLength <= uploadBudgetBytes) return asset
	try {
		const { default: sharp } = await import("sharp")
		for (const [size, quality] of [
			[1600, 82],
			[1280, 72],
			[960, 62],
		] as const) {
			const bytes = await sharp(asset.bytes, { limitInputPixels: 40_000_000 })
				.rotate()
				.resize({ width: size, height: size, fit: "inside", withoutEnlargement: true })
				.flatten({ background: "#ffffff" })
				.jpeg({ quality })
				.toBuffer()
			if (bytes.byteLength <= uploadBudgetBytes) return { bytes, mimeType: "image/jpeg" }
		}
	} catch {
		throw new SocialPublishingError("media", "COVER_OPTIMIZATION")
	}
	throw new SocialPublishingError("media", "COVER_UPLOAD_SIZE")
}
