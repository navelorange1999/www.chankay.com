import { unstable_cache } from "next/cache"
import {
	fingerprint,
	validateArtifact,
	type HandwritingInput,
	type HandwritingArtifact,
} from "@chankay/handwriting/schema"

export async function getHandwriting(input: HandwritingInput): Promise<HandwritingArtifact | null> {
	try {
		const key = await fingerprint(input)
		return await unstable_cache(
			async () => {
				const secret = process.env.WWW_INTERNAL_SECRET?.trim()
				if (!secret) throw new Error("Handwriting artifact access is not configured")
				const base =
					process.env.PAYLOAD_API_URL?.trim() ||
					(process.env.NODE_ENV === "production" ? "" : "http://localhost:3001/api")
				if (!base) throw new Error("Payload API is not configured")
				const response = await fetch(`${base.replace(/\/+$/, "")}/handwriting/${key}`, {
					headers: { "www-internal-secret": secret },
					cache: "no-store",
					signal: AbortSignal.timeout(10_000),
				})
				if (response.status === 404) return null
				if (!response.ok) throw new Error("Handwriting artifact is unavailable")
				return validateArtifact(await response.json(), key)
			},
			["handwriting", key],
			{ tags: [`handwriting:${key}`], revalidate: 3600 }
		)()
	} catch {
		// Keep the current text visible when generation or storage is unavailable.
		return null
	}
}
