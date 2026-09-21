import { generateHandwriting, loadModel, type HandwritingModel } from "./generator.js"
import { normalizeInput } from "./schema.js"
import { PROTOCOL_VERSION } from "./protocol.js"
export { PROTOCOL_VERSION } from "./protocol.js"
/** The transport is separate so download/cancellation races can be tested without a browser. */
export function createWorkerHandler(
	send: (message: unknown) => void,
	dependencies = { loadModel, generateHandwriting }
) {
	let newestId = 0
	let active: AbortController | undefined
	let cached: { url: string; model: HandwritingModel } | undefined
	return (value: unknown): void => {
		if (!value || typeof value !== "object") return
		const message = value as Record<string, unknown>
		if (!Number.isSafeInteger(message.id) || (message.id as number) <= newestId) return
		const id = message.id as number
		newestId = id
		active?.abort()
		if (message.type === "cancel") return
		const controller = new AbortController()
		active = controller
		void (async () => {
			try {
				if (
					message.version !== PROTOCOL_VERSION ||
					message.type !== "generate" ||
					typeof message.url !== "string"
				)
					throw new Error("Incompatible generation request.")
				const input = normalizeInput(message.input)
				const model =
					cached?.url === message.url
						? cached.model
						: await dependencies.loadModel({ url: message.url, signal: controller.signal })
				if (controller.signal.aborted || id !== newestId) return
				cached = { url: message.url, model }
				const artifact = await dependencies.generateHandwriting(input, {
					model,
					signal: controller.signal,
				})
				if (!controller.signal.aborted && id === newestId)
					send({ type: "result", id, version: PROTOCOL_VERSION, artifact })
			} catch (error) {
				if (!controller.signal.aborted && id === newestId)
					send({
						type: "error",
						id,
						version: PROTOCOL_VERSION,
						message: error instanceof Error ? error.message : "Generation failed.",
					})
			}
		})()
	}
}
