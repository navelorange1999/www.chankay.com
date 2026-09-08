import { handleCallback } from "@vercel/queue"
import { processSocialPublication } from "@/services/socialPublishing/processor"
import type { QueueMessage } from "@/services/socialPublishing/state"

const callback = handleCallback<QueueMessage>(
	async (message) => {
		await processSocialPublication(message)
	},
	{
		retry: (_, metadata) => ({
			afterSeconds: Math.min(300, Math.max(1, metadata.deliveryCount) * 30),
		}),
		visibilityTimeoutSeconds: 150,
	}
)
export async function POST(request: Request) {
	return callback(request)
}
