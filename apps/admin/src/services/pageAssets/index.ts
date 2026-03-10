import type { CollectionAfterChangeHook } from "payload"

import { GENERATION_CONTEXT_FLAG } from "./constants"
import { runPageGeneratedAssets } from "./sync"
import type { MaybeDoc } from "./types"
import { asRecord, cloneMaybeDoc } from "./utils"

const queuedPageAssetJobs = new Map<string, Promise<void>>()

function schedulePageGeneratedAssets(args: {
	doc: MaybeDoc
	previousDoc: MaybeDoc | null
	req: Parameters<CollectionAfterChangeHook>[0]["req"]
}) {
	const pageId = args.doc.id
	const docSnapshot = cloneMaybeDoc(args.doc)
	const previousDocSnapshot = cloneMaybeDoc(args.previousDoc)
	const previousJob = queuedPageAssetJobs.get(pageId) ?? Promise.resolve()

	const nextJob = previousJob
		.catch(() => undefined)
		.then(async () => {
			await new Promise((resolve) => setTimeout(resolve, 0))
			await runPageGeneratedAssets({
				doc: docSnapshot,
				previousDoc: previousDocSnapshot,
				req: args.req,
			})
		})
		.catch((error) => {
			const message = error instanceof Error ? error.stack || error.message : String(error)
			args.req.payload.logger.error(
				`Failed to sync generated page assets for ${pageId}: ${message}`
			)
		})
		.finally(() => {
			if (queuedPageAssetJobs.get(pageId) === nextJob) {
				queuedPageAssetJobs.delete(pageId)
			}
		})

	queuedPageAssetJobs.set(pageId, nextJob)
}

export const syncPageGeneratedAssets: CollectionAfterChangeHook = async ({
	doc,
	previousDoc,
	req,
}) => {
	if (asRecord(req.context)[GENERATION_CONTEXT_FLAG]) {
		return doc
	}

	schedulePageGeneratedAssets({
		doc: doc as unknown as MaybeDoc,
		previousDoc: (previousDoc as unknown as MaybeDoc | null) ?? null,
		req,
	})

	return doc
}
