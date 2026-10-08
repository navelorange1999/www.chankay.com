import { handleCallback } from "@vercel/queue"
import { getPayload } from "payload"
import configPromise from "@payload-config"

import { processCommittedRevalidationJob } from "@/services/revalidation/worker"

type RevalidationQueueMessage = { jobId: string }

const queueCallback = handleCallback<RevalidationQueueMessage>(
	async (message) => {
		if (typeof message?.jobId !== "string" || !/^[a-f0-9]{24}$/i.test(message.jobId)) {
			throw new Error("Invalid revalidation queue message")
		}
		const payload = await getPayload({ config: configPromise })
		await processCommittedRevalidationJob(payload, message.jobId)
	},
	{
		retry: (_, metadata) => ({
			afterSeconds: Math.min(Math.max(metadata.deliveryCount, 1) * 30, 300),
		}),
		visibilityTimeoutSeconds: 300,
	}
)

export async function POST(request: Request) {
	return queueCallback(request)
}
