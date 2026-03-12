import { handleCallback } from "@vercel/queue"

import { processPageAssetsJob } from "@/services/pageAssets/processor"

type PageAssetsQueueMessage = {
	pageId: string
}

const queueCallback = handleCallback<PageAssetsQueueMessage>(
	async (message) => {
		await processPageAssetsJob({
			pageId: message.pageId,
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
