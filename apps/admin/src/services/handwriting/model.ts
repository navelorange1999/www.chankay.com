import { get, put } from "@vercel/blob"
import { parseModel } from "@chankay/handwriting/generator"
import { MODEL_SHA256 } from "@chankay/handwriting/schema"

export const MODEL_PATH = `handwriting/models/${MODEL_SHA256}.bin`
const MAX_MODEL_BYTES = 8_000_000

async function readBytes(stream: ReadableStream<Uint8Array>, declaredSize?: number) {
	if (
		declaredSize !== undefined &&
		(!Number.isFinite(declaredSize) || declaredSize > MAX_MODEL_BYTES || declaredSize < 16)
	) {
		await stream.cancel()
		throw new Error("Invalid model size")
	}
	const reader = stream.getReader()
	const chunks: Uint8Array[] = []
	let size = 0
	try {
		while (true) {
			const { done, value } = await reader.read()
			if (done) break
			size += value.byteLength
			if (size > MAX_MODEL_BYTES) throw new Error("Invalid model size")
			chunks.push(value)
		}
	} catch (error) {
		await reader.cancel()
		throw error
	} finally {
		reader.releaseLock()
	}
	const bytes = new Uint8Array(size)
	let offset = 0
	for (const chunk of chunks) {
		bytes.set(chunk, offset)
		offset += chunk.byteLength
	}
	return bytes
}

/** Import once into immutable private storage; subsequent cold starts need only Blob. */
export async function loadPrivateModel() {
	const token = process.env.HANDWRITING_BLOB_READ_WRITE_TOKEN
	if (!token) throw new Error("Private handwriting storage is not configured")
	const signal = AbortSignal.timeout(25_000)
	const options = { token, access: "private" as const, abortSignal: signal }
	async function readStored() {
		const result = await get(MODEL_PATH, { ...options, useCache: false })
		if (!result) return null
		if (result.statusCode !== 200) throw new Error("Unexpected model storage response")
		// The Blob SDK reports zero when a private response omits Content-Length.
		return parseModel((await readBytes(result.stream, result.blob.size || undefined)).buffer)
	}
	const stored = await readStored()
	if (stored) return stored
	const source = process.env.HANDWRITING_MODEL_URL?.trim()
	if (!source) throw new Error("Model is missing from Blob and no import URL is configured")
	let url: URL
	try {
		url = new URL(source)
	} catch {
		throw new Error("Invalid model import URL")
	}
	if (
		source.length > 2048 ||
		!["https:", "http:"].includes(url.protocol) ||
		url.username ||
		url.password
	)
		throw new Error("Invalid model import URL")
	const response = await fetch(url.href, { signal, credentials: "omit", redirect: "error" })
	if (!response.ok || !response.body) throw new Error("Model import download failed")
	const declaredSize = response.headers.get("content-length")
	const bytes = await readBytes(
		response.body,
		declaredSize === null ? undefined : Number(declaredSize)
	)
	const model = await parseModel(bytes.buffer)
	try {
		await put(MODEL_PATH, bytes, {
			...options,
			addRandomSuffix: false,
			allowOverwrite: false,
			contentType: "application/octet-stream",
			cacheControlMaxAge: 31536000,
		})
	} catch (error) {
		// A parallel instance may have imported the same pinned model first.
		const winner = await readStored()
		if (winner) return winner
		throw error
	}
	return model
}
