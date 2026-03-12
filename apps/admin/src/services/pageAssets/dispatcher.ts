import { send } from "@vercel/queue"

import { PAGE_ASSETS_QUEUE_TOPIC } from "./constants"
import { processPageAssetsJob } from "./processor"
import type { LoggerLike } from "./types"

const queuedPageAssetJobs = new Map<string, Promise<void>>()

function shouldDispatchPageAssetJobsViaQueue(): boolean {
	if (process.env.NODE_ENV === "development") {
		return false
	}

	return Boolean(process.env.VERCEL?.trim())
}

function scheduleInlinePageAssetJob(args: { logger?: LoggerLike; pageId: string }) {
	const previousJob = queuedPageAssetJobs.get(args.pageId) ?? Promise.resolve()
	const nextJob = previousJob
		.catch(() => undefined)
		.then(async () => {
			await processPageAssetsJob({
				pageId: args.pageId,
			})
		})
		.catch((error) => {
			const message = error instanceof Error ? error.stack || error.message : String(error)
			args.logger?.error?.(`Failed to process generated page assets for ${args.pageId}: ${message}`)
		})
		.finally(() => {
			if (queuedPageAssetJobs.get(args.pageId) === nextJob) {
				queuedPageAssetJobs.delete(args.pageId)
			}
		})

	queuedPageAssetJobs.set(args.pageId, nextJob)
}

async function dispatchPageAssetJobToQueue(args: { logger?: LoggerLike; pageId: string }) {
	const result = await send(PAGE_ASSETS_QUEUE_TOPIC, {
		pageId: args.pageId,
	})

	args.logger?.info?.(
		`Dispatched page assets job via queue for page ${args.pageId} (${result.messageId || "deferred"})`
	)
}

export async function enqueuePageAssetsJob(args: { logger?: LoggerLike; pageId: string }) {
	if (shouldDispatchPageAssetJobsViaQueue()) {
		await dispatchPageAssetJobToQueue(args)
		return
	}

	scheduleInlinePageAssetJob(args)
}
