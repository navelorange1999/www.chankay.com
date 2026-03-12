import { DEFAULT_WAIT_FOR_MS } from "./constants"
import type { GenericBlock, MaybeDoc } from "./types"
import {
	asOptionalBoolean,
	asOptionalString,
	asRecord,
	cloneBlocks,
	collectBlocksById,
	resolvePreviewStatus,
	resolveWaitForMs,
} from "./utils"

export type PageAssetPlan = {
	hasWork: boolean
	queuedOg: boolean
	queuedPreviewBlocks: number
	seo?: Record<string, unknown>
	structure?: GenericBlock[]
}

function shouldGeneratePageOg(doc: MaybeDoc): boolean {
	const seo = asRecord(doc.seo)
	return Boolean(asOptionalBoolean(seo.autoGenerateOgImage)) && Boolean(asOptionalString(doc.slug))
}

function resolvePreviewBlockShouldQueue(args: {
	block: GenericBlock
	previousById: Map<string, GenericBlock>
}) {
	const previewUrl = asOptionalString(args.block.previewUrl)
	if (!previewUrl) {
		return false
	}

	const blockId = asOptionalString(args.block.id)
	const previousBlock = blockId ? args.previousById.get(blockId) : undefined
	const previousUrl = previousBlock ? asOptionalString(previousBlock.previewUrl) : undefined
	const previousWaitForMs = previousBlock
		? resolveWaitForMs(previousBlock.waitForMs)
		: DEFAULT_WAIT_FOR_MS
	const previewImage = args.block.previewImage
	const status = resolvePreviewStatus(args.block.previewStatus)
	const waitForMs = resolveWaitForMs(args.block.waitForMs)

	return (
		previewUrl !== previousUrl ||
		waitForMs !== previousWaitForMs ||
		!previewImage ||
		status === "failed"
	)
}

export function resolveQueuedPageAssetPlan(args: {
	doc: MaybeDoc
	previousDoc: MaybeDoc | null
}): PageAssetPlan {
	const previousById = new Map<string, GenericBlock>()
	collectBlocksById(args.previousDoc?.structure, previousById)

	let queuedPreviewBlocks = 0

	function queuePreviewBlocks(blocks: GenericBlock[]): GenericBlock[] {
		return blocks.map((block) => {
			const nextBlock: GenericBlock = { ...block }
			const blockType = asOptionalString(nextBlock.blockType)

			if (
				blockType === "previewUrl" &&
				resolvePreviewBlockShouldQueue({
					block: nextBlock,
					previousById,
				})
			) {
				nextBlock.previewStatus = "queued"
				queuedPreviewBlocks += 1
			}

			if (Array.isArray(block.children)) {
				nextBlock.children = queuePreviewBlocks(block.children as GenericBlock[])
			}

			return nextBlock
		})
	}

	const structure = queuePreviewBlocks(cloneBlocks(args.doc.structure))
	const queuedOg = shouldGeneratePageOg(args.doc)

	if (!queuedOg && queuedPreviewBlocks === 0) {
		return {
			hasWork: false,
			queuedOg: false,
			queuedPreviewBlocks: 0,
		}
	}

	const nextSeo = queuedOg
		? {
				...asRecord(args.doc.seo),
				ogGenerationStatus: "queued",
			}
		: undefined

	return {
		hasWork: true,
		queuedOg,
		queuedPreviewBlocks,
		seo: nextSeo,
		structure,
	}
}
