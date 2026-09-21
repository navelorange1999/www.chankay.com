import {
	fingerprint,
	normalizeInput,
	type HandwritingInput,
	type HandwritingArtifact,
} from "@chankay/handwriting/schema"
import { generateHandwriting, loadModel } from "@chankay/handwriting/generator"
import { createArtifactCache } from "./cache"
import { readArtifact, writeArtifact } from "./blob"

let modelPromise: ReturnType<typeof loadModel> | undefined
function getModel() {
	if (!modelPromise) {
		const url = process.env.HANDWRITING_MODEL_URL?.trim()
		if (!url) throw new Error("A licensed handwriting model URL must be configured")
		modelPromise = loadModel({ url, signal: AbortSignal.timeout(25_000) }).catch(
			(error: unknown) => {
				modelPromise = undefined
				throw error
			}
		)
	}
	return modelPromise
}

const cache = createArtifactCache<HandwritingInput, HandwritingArtifact>({
	read: readArtifact,
	write: writeArtifact,
	generate: async (input) =>
		generateHandwriting(input, { model: await getModel(), signal: AbortSignal.timeout(20_000) }),
})

export async function ensureHandwriting(input: unknown) {
	const normalized = normalizeInput(input)
	return cache.ensure(await fingerprint(normalized), normalized)
}
