import type { CollectionAfterChangeHook } from "payload"

import { enqueuePageAssetsJob } from "./dispatcher"
import { resolveQueuedPageAssetPlan } from "./planner"
import { triggerFrontendRevalidation } from "./processor"
import { createPageAssetsRuntime, updatePageWithGenerationContext } from "./state"
import type { MaybeDoc } from "./types"
import { asRecord } from "./utils"
import { GENERATION_CONTEXT_FLAG } from "./constants"

function buildFailedData(args: {
	doc: MaybeDoc
	plan: ReturnType<typeof resolveQueuedPageAssetPlan>
}) {
	return {
		seo: args.plan.queuedOg
			? {
					...asRecord(args.doc.seo),
					ogGenerationStatus: "failed",
				}
			: args.doc.seo,
		structure:
			args.plan.queuedPreviewBlocks > 0
				? args.plan.structure?.map(function visit(block) {
						const nextBlock = { ...block }
						if (nextBlock.previewStatus === "queued") {
							nextBlock.previewStatus = "failed"
						}

						if (Array.isArray(block.children)) {
							nextBlock.children = block.children.map((child) => visit(child as typeof block))
						}

						return nextBlock
					})
				: args.doc.structure,
	}
}

export const syncPageGeneratedAssets: CollectionAfterChangeHook = async ({
	doc,
	previousDoc,
	req,
}) => {
	if (asRecord(req.context)[GENERATION_CONTEXT_FLAG]) {
		return doc
	}

	const currentDoc = doc as unknown as MaybeDoc
	const previousDocSnapshot = (previousDoc as unknown as MaybeDoc | null) ?? null
	const runtime = await createPageAssetsRuntime(req)
	const plan = resolveQueuedPageAssetPlan({
		doc: currentDoc,
		previousDoc: previousDocSnapshot,
	})

	try {
		await triggerFrontendRevalidation({
			currentSlug: currentDoc.slug,
			previousSlug: previousDocSnapshot?.slug,
			runtime,
		})
	} catch {
		// Best effort only. Content changes are still persisted even if revalidation fails.
	}

	if (!plan.hasWork) {
		return doc
	}

	const queuedDoc = await updatePageWithGenerationContext({
		data: {
			seo: plan.seo ?? currentDoc.seo,
			structure: plan.structure ?? currentDoc.structure,
		},
		id: currentDoc.id,
		runtime,
	})

	try {
		await enqueuePageAssetsJob({
			logger: runtime.logger,
			pageId: currentDoc.id,
		})

		return queuedDoc as unknown as typeof doc
	} catch (error) {
		const failedDoc = await updatePageWithGenerationContext({
			data: buildFailedData({
				doc: queuedDoc,
				plan,
			}),
			id: currentDoc.id,
			runtime,
		})

		const message = error instanceof Error ? error.stack || error.message : String(error)
		runtime.logger.error?.(
			`Failed to enqueue generated page assets for ${currentDoc.id}: ${message}`
		)

		return failedDoc as unknown as typeof doc
	}
}
