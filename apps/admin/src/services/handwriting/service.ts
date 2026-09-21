import {
	fingerprint,
	normalizeInput,
	type HandwritingInput,
	type HandwritingArtifact,
} from "@chankay/handwriting/schema"
import { generateHandwriting } from "@chankay/handwriting/generator"
import { loadPrivateModel } from "./model"
import { createArtifactCache } from "./cache"
import { readArtifact, writeArtifact } from "./blob"

let modelPromise: ReturnType<typeof loadPrivateModel> | undefined
function getModel() {
	if (!modelPromise) {
		modelPromise = loadPrivateModel().catch((error: unknown) => {
			modelPromise = undefined
			throw error
		})
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
