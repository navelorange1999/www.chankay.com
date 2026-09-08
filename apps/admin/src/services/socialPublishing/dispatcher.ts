import { send } from "@vercel/queue"
import { queueSchema } from "./validation"
import type { QueueMessage } from "./state"

const inlineJobs = new Map<string, Promise<void>>()
export async function enqueueSocialPublication(input: QueueMessage, delaySeconds = 0) {
	const message = queueSchema.parse(input)
	const delay = Math.min(300, Math.max(0, delaySeconds))
	if (process.env.VERCEL && process.env.NODE_ENV !== "development") {
		await send("social-publications", message, { delaySeconds: delay })
		return
	}
	const schedule = () => {
		const previous = inlineJobs.get(message.publicationId) ?? Promise.resolve()
		const next = previous
			.catch(() => undefined)
			.then(async () => {
				const { processSocialPublication } = await import("./processor")
				await processSocialPublication(message)
			})
			.catch(() => {
				// Provider details must never reach logs. A subsequent command or queue
				// delivery reconciles the persisted state after a process failure.
				console.error("Social publication worker failed; inspect its audit record.")
			})
			.finally(() => {
				if (inlineJobs.get(message.publicationId) === next) inlineJobs.delete(message.publicationId)
			})
		inlineJobs.set(message.publicationId, next)
	}
	if (delay) setTimeout(schedule, delay * 1000)
	else schedule()
}
