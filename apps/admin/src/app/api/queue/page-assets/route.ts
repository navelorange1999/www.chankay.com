import { handleCallback } from "@vercel/queue"

import { processPageAssetsJob } from "@/services/pageAssets/processor"

type PageAssetsQueueMessage = {
	pageId: string
	expectedUpdatedAt: string
}

const queueCallback = handleCallback<PageAssetsQueueMessage>(
	async (message) => {
		if (
			typeof message?.pageId !== "string" ||
			!/^[a-zA-Z0-9_-]{1,80}$/.test(message.pageId) ||
			typeof message.expectedUpdatedAt !== "string" ||
			message.expectedUpdatedAt.length > 40 ||
			!Number.isFinite(Date.parse(message.expectedUpdatedAt))
		) {
			throw new Error("Invalid page assets queue message")
		}
		await processPageAssetsJob({
			pageId: message.pageId,
			expectedUpdatedAt: message.expectedUpdatedAt,
		})
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
