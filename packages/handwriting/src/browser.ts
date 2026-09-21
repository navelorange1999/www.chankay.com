import {
	fingerprint,
	normalizeInput,
	validateArtifact,
	type HandwritingArtifact,
	type HandwritingInput,
} from "./schema.js"
import { PROTOCOL_VERSION } from "./protocol.js"
interface Pending {
	id: number
	hash?: string
	resolve: (artifact: HandwritingArtifact) => void
	reject: (error: Error) => void
}
export class HandwritingEngine {
	#worker: Worker
	#url: string
	#nextId = 0
	#pending?: Pending
	#disposed = false
	#failed?: Error
	constructor({ modelUrl }: { modelUrl: string }) {
		if (typeof modelUrl !== "string" || !modelUrl || modelUrl.length > 2048)
			throw new Error("A model URL is required.")
		let parsed: URL
		try {
			parsed = new URL(modelUrl, typeof location === "undefined" ? undefined : location.href)
		} catch {
			throw new Error("Model URL must use HTTP or HTTPS.")
		}
		if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password)
			throw new Error("Model URL must use HTTP or HTTPS without embedded authentication.")
		this.#url = parsed.href
		this.#worker = new Worker(new URL("./worker.js", import.meta.url), { type: "module" })
		this.#worker.addEventListener("message", ({ data }: MessageEvent<unknown>) => {
			if (!data || typeof data !== "object") return
			const message = data as Record<string, unknown>
			const pending = this.#pending
			if (!pending || message.id !== pending.id) return
			if (message.version !== PROTOCOL_VERSION) {
				this.#reject(new Error("Incompatible worker response."))
				return
			}
			if (message.type === "error") {
				this.#reject(
					new Error(
						typeof message.message === "string"
							? message.message.slice(0, 300)
							: "Generation failed."
					)
				)
				return
			}
			if (message.type !== "result") return
			try {
				if (!pending.hash) throw new Error("Unexpected worker response.")
				const artifact = validateArtifact(message.artifact, pending.hash)
				this.#pending = undefined
				pending.resolve(artifact)
			} catch (error) {
				this.#reject(error instanceof Error ? error : new Error("Invalid generation result."))
			}
		})
		const failed = () => {
			this.#failed = new Error("The handwriting worker failed. Create a new engine to retry.")
			this.#reject(this.#failed)
			this.#worker.terminate()
		}
		this.#worker.addEventListener("error", failed)
		this.#worker.addEventListener("messageerror", failed)
	}
	generate(input: HandwritingInput): Promise<HandwritingArtifact> {
		if (this.#disposed) return Promise.reject(new Error("Engine is disposed."))
		if (this.#failed) return Promise.reject(this.#failed)
		let normalized: ReturnType<typeof normalizeInput>
		try {
			normalized = normalizeInput(input)
		} catch (error) {
			return Promise.reject(error)
		}
		this.cancel()
		const id = ++this.#nextId
		return new Promise((resolve, reject) => {
			const pending: Pending = { id, resolve, reject }
			this.#pending = pending
			void fingerprint(normalized)
				.then((hash) => {
					if (this.#pending !== pending || this.#disposed) return
					pending.hash = hash
					this.#worker.postMessage({
						type: "generate",
						id,
						version: PROTOCOL_VERSION,
						url: this.#url,
						input: normalized,
					})
				})
				.catch((error: unknown) => {
					if (this.#pending === pending)
						this.#reject(error instanceof Error ? error : new Error("Generation request failed."))
				})
		})
	}
	#reject(error: Error): void {
		const pending = this.#pending
		this.#pending = undefined
		pending?.reject(error)
	}
	cancel(): void {
		if (!this.#pending) return
		this.#reject(new DOMException("Generation cancelled.", "AbortError"))
		this.#worker.postMessage({ type: "cancel", id: ++this.#nextId, version: PROTOCOL_VERSION })
	}
	dispose(): void {
		if (this.#disposed) return
		this.cancel()
		this.#disposed = true
		this.#worker.terminate()
	}
}
