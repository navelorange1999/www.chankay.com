import { generate, parseModel as parseTensors } from "./model.mjs"
import { buildGeometry } from "./geometry.js"
import { collectPoints } from "./sampling.js"
import {
	fingerprint,
	MODEL_SHA256,
	normalizeInput,
	SCHEMA_VERSION,
	STYLES,
	validateArtifact,
	type HandwritingInput,
	type HandwritingArtifact,
} from "./schema.js"

declare const modelBrand: unique symbol
export interface HandwritingModel {
	readonly [modelBrand]: true
}
const models = new WeakMap<HandwritingModel, ReturnType<typeof parseTensors>>()
const MAX_MODEL_BYTES = 8_000_000
function aborted(signal?: AbortSignal): void {
	if (signal?.aborted) throw new DOMException("Generation cancelled.", "AbortError")
}
/** Verifies the pinned digest before parsing an immutable snapshot of the tensor buffer. */
export async function parseModel(buffer: ArrayBuffer): Promise<HandwritingModel> {
	if (
		!(buffer instanceof ArrayBuffer) ||
		buffer.byteLength < 16 ||
		buffer.byteLength > MAX_MODEL_BYTES
	)
		throw new Error("Invalid model size.")
	// Digest and parse the same private snapshot, even if a caller mutates its input while awaiting.
	const snapshot = buffer.slice(0)
	const hash = await crypto.subtle.digest("SHA-256", snapshot)
	const digest = Array.from(new Uint8Array(hash), (byte) =>
		byte.toString(16).padStart(2, "0")
	).join("")
	if (digest !== MODEL_SHA256) throw new Error("Model digest does not match the pinned version.")
	const tensors = parseTensors(snapshot)
	const model = Object.freeze({}) as HandwritingModel
	models.set(model, tensors)
	return model
}
export async function loadModel({
	url,
	signal,
}: {
	url: string
	signal?: AbortSignal
}): Promise<HandwritingModel> {
	aborted(signal)
	if (typeof url !== "string" || url.length > 2048)
		throw new Error("Model URL must use HTTP or HTTPS.")
	let parsed: URL
	try {
		parsed = new URL(url, typeof location === "undefined" ? undefined : location.href)
	} catch {
		throw new Error("Model URL must use HTTP or HTTPS.")
	}
	if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password)
		throw new Error("Model URL must use HTTP or HTTPS without embedded authentication.")
	const response = await fetch(parsed.href, { signal, credentials: "omit", redirect: "error" })
	if (!response.ok) throw new Error(`Model download failed (${response.status}).`)
	const declaredSize = response.headers.get("content-length")
	if (
		declaredSize !== null &&
		(!/^\d+$/.test(declaredSize) || Number(declaredSize) > MAX_MODEL_BYTES)
	) {
		await response.body?.cancel()
		throw new Error("Invalid model size.")
	}
	if (!response.body) throw new Error("Model response is empty.")
	const reader = response.body.getReader(),
		chunks: Uint8Array[] = []
	let size = 0
	try {
		while (true) {
			aborted(signal)
			const { done, value } = await reader.read()
			if (done) break
			size += value.byteLength
			if (size > MAX_MODEL_BYTES) throw new Error("Invalid model size.")
			chunks.push(value)
		}
	} catch (error) {
		await reader.cancel()
		throw error
	} finally {
		reader.releaseLock()
	}
	aborted(signal)
	const bytes = new Uint8Array(size)
	let offset = 0
	for (const chunk of chunks) {
		bytes.set(chunk, offset)
		offset += chunk.byteLength
	}
	const model = await parseModel(bytes.buffer)
	aborted(signal)
	return model
}
export async function generateHandwriting(
	input: HandwritingInput,
	{ model, signal }: { model: HandwritingModel; signal?: AbortSignal }
): Promise<HandwritingArtifact> {
	const normalized = normalizeInput(input)
	aborted(signal)
	const tensors = models.get(model)
	if (!tensors) throw new Error("Use a model returned by parseModel or loadModel.")
	const hash = await fingerprint(normalized)
	aborted(signal)
	const iterator = generate(tensors, normalized.text, {
		...normalized,
		style: STYLES.findIndex((entry) => entry.id === normalized.style),
	})
	const points = await collectPoints(iterator, signal)
	return validateArtifact(
		{
			schemaVersion: SCHEMA_VERSION,
			fingerprint: hash,
			text: normalized.text,
			...buildGeometry(points),
		},
		hash
	)
}
