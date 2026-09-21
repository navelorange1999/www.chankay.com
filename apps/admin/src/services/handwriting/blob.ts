import { get, put } from "@vercel/blob"
import { validateArtifact, type HandwritingArtifact } from "@chankay/handwriting/schema"
import { readJson } from "./readJson"

function pathname(key: string) {
	if (!/^[a-f0-9]{64}$/.test(key)) throw new Error("Invalid handwriting fingerprint")
	return `handwriting/v1/${key}.json`
}

function storageOptions() {
	const token = process.env.HANDWRITING_BLOB_READ_WRITE_TOKEN
	if (!token) throw new Error("Private handwriting storage is not configured")
	return { token, access: "private" as const, abortSignal: AbortSignal.timeout(15_000) }
}

export async function readArtifact(key: string): Promise<HandwritingArtifact | null> {
	const result = await get(pathname(key), { ...storageOptions(), useCache: false })
	if (!result) return null
	if (result.statusCode !== 200) throw new Error("Unexpected artifact storage response")
	if (result.blob.size > 1_000_000) {
		await result.stream.cancel()
		throw new Error("Handwriting artifact is too large")
	}
	return validateArtifact(await readJson(result.stream, 1_000_000), key)
}

export async function writeArtifact(
	key: string,
	artifact: HandwritingArtifact
): Promise<HandwritingArtifact> {
	const validated = validateArtifact(artifact, key)
	const body = JSON.stringify(validated)
	if (new TextEncoder().encode(body).byteLength > 1_000_000)
		throw new Error("Handwriting artifact is too large")
	try {
		await put(pathname(key), body, {
			...storageOptions(),
			addRandomSuffix: false,
			allowOverwrite: false,
			contentType: "application/json",
			cacheControlMaxAge: 31536000,
		})
	} catch (error) {
		// Another instance may have created this immutable artifact while we generated it.
		const existing = await readArtifact(key)
		if (existing) return existing
		throw error
	}
	return validated
}
