export async function readJson(
	stream: ReadableStream<Uint8Array> | null,
	limit: number
): Promise<unknown> {
	if (!stream) throw new Error("Missing JSON body")
	const reader = stream.getReader()
	const chunks: Uint8Array[] = []
	let size = 0
	try {
		while (true) {
			const { value, done } = await reader.read()
			if (done) break
			size += value.byteLength
			if (size > limit) {
				await reader.cancel()
				throw new Error("JSON body is too large")
			}
			chunks.push(value)
		}
	} finally {
		reader.releaseLock()
	}
	const bytes = new Uint8Array(size)
	let offset = 0
	for (const chunk of chunks) {
		bytes.set(chunk, offset)
		offset += chunk.byteLength
	}
	return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes))
}
