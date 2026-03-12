import {
	DEFAULT_WAIT_FOR_MS,
	DEFAULT_WWW_SITE_URL,
	GENERATION_CONTEXT_FLAG,
	WWW_INTERNAL_SECRET_HEADER,
} from "./constants"
import { captureScreenshot, persistGeneratedMedia } from "./capture"
import type { GenericBlock, MaybeDoc, PageAssetsRequest } from "./types"
import {
	asArray,
	asOptionalBoolean,
	asOptionalString,
	asRecord,
	cloneBlocks,
	collectBlocksById,
	resolvePreviewPagePath,
	resolvePreviewStatus,
	resolveWaitForMs,
} from "./utils"

async function resolveSiteUrl(req: PageAssetsRequest): Promise<string> {
	try {
		const siteConfig = await req.payload.findGlobal({
			slug: "site-config",
			depth: 1,
			overrideAccess: true,
		})
		const siteUrl = asOptionalString(asRecord(siteConfig).siteUrl)
		if (siteUrl) {
			return siteUrl.replace(/\/+$/g, "")
		}
	} catch {
		// Fall back to env/local default below.
	}

	const envSiteUrl = asOptionalString(process.env.WWW_SITE_URL)
	return (envSiteUrl || DEFAULT_WWW_SITE_URL).replace(/\/+$/g, "")
}

async function triggerFrontendRevalidation(args: {
	currentSlug?: string | null
	previousSlug?: string | null
	req: PageAssetsRequest
}) {
	const siteUrl = await resolveSiteUrl(args.req)
	const sharedSecret = asOptionalString(process.env.WWW_INTERNAL_SECRET)

	if (!sharedSecret) {
		return
	}

	const slugs = [args.currentSlug, args.previousSlug]
		.map((value) => asOptionalString(value))
		.filter(
			(value, index, array): value is string => Boolean(value) && array.indexOf(value) === index
		)

	if (slugs.length === 0) {
		return
	}

	const response = await fetch(new URL("/api/revalidate", siteUrl), {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			[WWW_INTERNAL_SECRET_HEADER]: sharedSecret,
		},
		body: JSON.stringify({
			slugs,
		}),
	})

	if (!response.ok) {
		throw new Error(`Frontend revalidation failed (${response.status})`)
	}
}

function resolvePreviewBlockShouldGenerate(args: {
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

async function syncPreviewUrlBlocks(args: {
	doc: MaybeDoc
	previousDoc: MaybeDoc | null
	req: PageAssetsRequest
}): Promise<MaybeDoc> {
	const previousById = new Map<string, GenericBlock>()
	collectBlocksById(args.previousDoc?.structure, previousById)

	let changed = false

	async function visit(blocks: GenericBlock[]): Promise<GenericBlock[]> {
		const nextBlocks: GenericBlock[] = []

		for (const block of blocks) {
			const nextBlock: GenericBlock = { ...block }
			const blockType = asOptionalString(nextBlock.blockType)

			if (
				blockType === "previewUrl" &&
				resolvePreviewBlockShouldGenerate({ block: nextBlock, previousById })
			) {
				const previewUrl = asOptionalString(nextBlock.previewUrl)
				const waitForTimeoutMs = resolveWaitForMs(nextBlock.waitForMs)
				const blockId = asOptionalString(nextBlock.id) || "unknown"

				if (previewUrl) {
					try {
						nextBlock.previewStatus = "generating"

						const screenshot = await captureScreenshot({
							height: 900,
							logger: args.req.payload.logger,
							url: previewUrl,
							waitForTimeoutMs,
							width: 1600,
						})

						const media = await persistGeneratedMedia({
							alt: `Preview for ${previewUrl}`,
							contentType: screenshot.contentType,
							filenamePrefix: "preview",
							req: args.req,
							screenshot,
							subject: previewUrl,
						})

						nextBlock.previewImage = media.id
						nextBlock.previewStatus = "ready"
						changed = true
					} catch (error) {
						const errorMessage = error instanceof Error ? error.message : String(error)
						args.req.payload.logger.error(
							`Preview image generation failed for page ${args.doc.id} block ${blockId} - Error: ${errorMessage} - URL: ${previewUrl} - Wait: ${waitForTimeoutMs}ms`
						)

						if (error instanceof Error && error.stack) {
							const stackLines = error.stack.split("\n").slice(0, 3).join(" | ")
							args.req.payload.logger.error(
								`Preview block stack trace for ${args.doc.id}/${blockId}: ${stackLines}`
							)
						}

						if (nextBlock.previewStatus !== "failed") {
							nextBlock.previewStatus = "failed"
							changed = true
						}
					}
				}
			}

			if (Array.isArray(block.children)) {
				nextBlock.children = await visit(asArray(block.children))
			}

			nextBlocks.push(nextBlock)
		}

		return nextBlocks
	}

	const nextStructure = await visit(cloneBlocks(args.doc.structure))

	if (!changed) {
		return args.doc
	}

	return (await args.req.payload.update({
		collection: "pages",
		context: {
			...(args.req.context || {}),
			[GENERATION_CONTEXT_FLAG]: true,
		},
		data: {
			structure: nextStructure,
		},
		depth: 1,
		id: args.doc.id,
		overrideAccess: true,
		req: args.req,
	})) as unknown as MaybeDoc
}

function shouldGeneratePageOg(doc: MaybeDoc): boolean {
	const seo = asRecord(doc.seo)
	return Boolean(asOptionalBoolean(seo.autoGenerateOgImage)) && Boolean(asOptionalString(doc.slug))
}

async function syncGeneratedOgImage(args: {
	doc: MaybeDoc
	req: PageAssetsRequest
}): Promise<MaybeDoc> {
	if (!shouldGeneratePageOg(args.doc)) {
		return args.doc
	}

	const siteUrl = await resolveSiteUrl(args.req)
	const sharedSecret = asOptionalString(process.env.WWW_INTERNAL_SECRET)
	const slug = asOptionalString(args.doc.slug)

	if (!sharedSecret || !slug) {
		return args.doc
	}

	const seo = asRecord(args.doc.seo)
	const previewUrl = new URL(resolvePreviewPagePath(slug), siteUrl)
	const waitForTimeoutMs = resolveWaitForMs(seo.waitForMs)

	try {
		const screenshot = await captureScreenshot({
			height: 630,
			logger: args.req.payload.logger,
			requestHeaders: {
				[WWW_INTERNAL_SECRET_HEADER]: sharedSecret,
			},
			url: previewUrl.toString(),
			waitForTimeoutMs,
			width: 1200,
		})

		const media = await persistGeneratedMedia({
			alt: `Open Graph image for ${args.doc.title || slug}`,
			contentType: screenshot.contentType,
			filenamePrefix: "og",
			req: args.req,
			screenshot,
			subject: slug,
		})

		return (await args.req.payload.update({
			collection: "pages",
			context: {
				...(args.req.context || {}),
				[GENERATION_CONTEXT_FLAG]: true,
			},
			data: {
				seo: {
					...seo,
					ogGenerationStatus: "ready",
					ogImage: media.id,
				},
			},
			depth: 1,
			id: args.doc.id,
			overrideAccess: true,
			req: args.req,
		})) as unknown as MaybeDoc
	} catch (error) {
		// Log the actual error to help debug production issues
		const errorMessage = error instanceof Error ? error.message : String(error)

		// Log error with all relevant context
		args.req.payload.logger.error(
			`OG image generation failed for page ${args.doc.id} (slug: ${slug}) - Error: ${errorMessage} - URL: ${previewUrl.toString()} - Wait: ${waitForTimeoutMs}ms`
		)

		// Log stack trace separately if available (first 3 lines only to avoid truncation)
		if (error instanceof Error && error.stack) {
			const stackLines = error.stack.split("\n").slice(0, 3).join(" | ")
			args.req.payload.logger.error(`Stack trace for ${args.doc.id}: ${stackLines}`)
		}

		const nextStatus = seo.ogGenerationStatus === "failed" ? seo.ogGenerationStatus : "failed"

		return (await args.req.payload.update({
			collection: "pages",
			context: {
				...(args.req.context || {}),
				[GENERATION_CONTEXT_FLAG]: true,
			},
			data: {
				seo: {
					...seo,
					ogGenerationStatus: nextStatus,
				},
			},
			depth: 1,
			id: args.doc.id,
			overrideAccess: true,
			req: args.req,
		})) as unknown as MaybeDoc
	}
}

export async function runPageGeneratedAssets(args: {
	doc: MaybeDoc
	previousDoc: MaybeDoc | null
	req: PageAssetsRequest
}) {
	let currentDoc = args.doc

	currentDoc = await syncPreviewUrlBlocks({
		doc: currentDoc,
		previousDoc: args.previousDoc,
		req: args.req,
	})

	currentDoc = await syncGeneratedOgImage({
		doc: currentDoc,
		req: args.req,
	})

	try {
		await triggerFrontendRevalidation({
			currentSlug: currentDoc.slug,
			previousSlug: args.previousDoc?.slug,
			req: args.req,
		})
	} catch {
		// Best effort only. Content changes are still persisted even if revalidation fails.
	}
}
