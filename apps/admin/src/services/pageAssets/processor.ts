import { DEFAULT_WWW_SITE_URL, WWW_INTERNAL_SECRET_HEADER } from "./constants"
import { captureScreenshot, persistGeneratedMedia } from "./capture"
import { createPageAssetsRuntime, updatePageWithGenerationContext } from "./state"
import type { GenericBlock, MaybeDoc, PageAssetsRuntime } from "./types"
import {
	asArray,
	asOptionalBoolean,
	asOptionalString,
	asRecord,
	cloneBlocks,
	resolvePreviewPagePath,
	resolvePreviewStatus,
	resolveWaitForMs,
} from "./utils"

type PreviewGenerationResult = {
	mediaId?: string
	status: "failed" | "ready"
}

type OgGenerationResult = {
	mediaId?: string
	status: "failed" | "ready"
}

async function loadPageById(args: {
	pageId: string
	runtime: PageAssetsRuntime
}): Promise<MaybeDoc | null> {
	try {
		return (await args.runtime.payload.findByID({
			collection: "pages",
			depth: 1,
			id: args.pageId,
			overrideAccess: true,
			req: args.runtime.request,
		})) as unknown as MaybeDoc
	} catch {
		return null
	}
}

async function resolveSiteUrl(runtime: PageAssetsRuntime): Promise<string> {
	try {
		const siteConfig = await runtime.payload.findGlobal({
			slug: "site-config",
			depth: 1,
			overrideAccess: true,
			req: runtime.request,
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

export async function triggerFrontendRevalidation(args: {
	currentSlug?: string | null
	previousSlug?: string | null
	runtime: PageAssetsRuntime
}) {
	const siteUrl = await resolveSiteUrl(args.runtime)
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
			collection: "pages",
			slugs,
		}),
	})

	if (!response.ok) {
		throw new Error(`Frontend revalidation failed (${response.status})`)
	}
}

function markQueuedAssetsAsGenerating(args: { doc: MaybeDoc }) {
	let changed = false
	const nextStructure = cloneBlocks(args.doc.structure).map(function visit(block): GenericBlock {
		const nextBlock: GenericBlock = { ...block }
		if (resolvePreviewStatus(nextBlock.previewStatus) === "queued") {
			nextBlock.previewStatus = "generating"
			changed = true
		}

		if (Array.isArray(block.children)) {
			nextBlock.children = block.children.map((child) => visit(child as GenericBlock))
		}

		return nextBlock
	})

	const seo = asRecord(args.doc.seo)
	let nextSeo: Record<string, unknown> | undefined

	if (asOptionalString(seo.ogGenerationStatus) === "queued") {
		nextSeo = {
			...seo,
			ogGenerationStatus: "generating",
		}
		changed = true
	}

	return {
		changed,
		seo: nextSeo,
		structure: nextStructure,
	}
}

async function markGeneratingPageAssets(args: { doc: MaybeDoc; runtime: PageAssetsRuntime }) {
	const next = markQueuedAssetsAsGenerating({
		doc: args.doc,
	})

	if (!next.changed) {
		return args.doc
	}

	return await updatePageWithGenerationContext({
		data: {
			seo: next.seo ?? args.doc.seo,
			structure: next.structure,
		},
		id: args.doc.id,
		runtime: args.runtime,
	})
}

async function processGeneratingPreviewBlocks(args: { doc: MaybeDoc; runtime: PageAssetsRuntime }) {
	const results = new Map<string, PreviewGenerationResult>()

	async function visit(blocks: GenericBlock[]) {
		for (const block of blocks) {
			const nextBlock = block
			if (
				asOptionalString(nextBlock.blockType) === "previewUrl" &&
				resolvePreviewStatus(nextBlock.previewStatus) === "generating"
			) {
				const previewUrl = asOptionalString(nextBlock.previewUrl)
				const blockId = asOptionalString(nextBlock.id)
				const waitForTimeoutMs = resolveWaitForMs(nextBlock.waitForMs)

				if (!previewUrl || !blockId) {
					continue
				}

				try {
					const screenshot = await captureScreenshot({
						height: 900,
						logger: args.runtime.logger,
						url: previewUrl,
						waitForTimeoutMs,
						width: 1600,
					})

					const media = await persistGeneratedMedia({
						alt: `Preview for ${previewUrl}`,
						contentType: screenshot.contentType,
						filenamePrefix: "preview",
						runtime: args.runtime,
						screenshot,
						subject: previewUrl,
					})

					results.set(blockId, {
						mediaId: media.id,
						status: "ready",
					})
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : String(error)
					args.runtime.logger.error?.(
						`Preview image generation failed for page ${args.doc.id} block ${blockId} - Error: ${errorMessage} - URL: ${previewUrl} - Wait: ${waitForTimeoutMs}ms`
					)

					if (error instanceof Error && error.stack) {
						const stackLines = error.stack.split("\n").slice(0, 3).join(" | ")
						args.runtime.logger.error?.(
							`Preview block stack trace for ${args.doc.id}/${blockId}: ${stackLines}`
						)
					}

					results.set(blockId, {
						status: "failed",
					})
				}
			}

			if (Array.isArray(block.children)) {
				await visit(asArray(block.children))
			}
		}
	}

	await visit(asArray(args.doc.structure))

	if (results.size === 0) {
		return args.doc
	}

	const latestDoc = await loadPageById({
		pageId: args.doc.id,
		runtime: args.runtime,
	})

	if (!latestDoc) {
		return args.doc
	}

	let changed = false

	function applyResults(blocks: GenericBlock[]): GenericBlock[] {
		return blocks.map((block) => {
			const nextBlock: GenericBlock = { ...block }
			const blockId = asOptionalString(nextBlock.id)
			const result = blockId ? results.get(blockId) : undefined

			if (result && resolvePreviewStatus(nextBlock.previewStatus) === "generating") {
				nextBlock.previewStatus = result.status
				if (result.mediaId) {
					nextBlock.previewImage = result.mediaId
				}
				changed = true
			}

			if (Array.isArray(block.children)) {
				nextBlock.children = applyResults(asArray(block.children))
			}

			return nextBlock
		})
	}

	const nextStructure = applyResults(cloneBlocks(latestDoc.structure))

	if (!changed) {
		return latestDoc
	}

	return await updatePageWithGenerationContext({
		data: {
			structure: nextStructure,
		},
		id: latestDoc.id,
		runtime: args.runtime,
	})
}

function shouldGeneratePageOg(doc: MaybeDoc): boolean {
	const seo = asRecord(doc.seo)
	return Boolean(asOptionalBoolean(seo.autoGenerateOgImage)) && Boolean(asOptionalString(doc.slug))
}

async function processGeneratingOgImage(args: { doc: MaybeDoc; runtime: PageAssetsRuntime }) {
	if (!shouldGeneratePageOg(args.doc)) {
		return args.doc
	}

	const seo = asRecord(args.doc.seo)
	if (asOptionalString(seo.ogGenerationStatus) !== "generating") {
		return args.doc
	}

	const siteUrl = await resolveSiteUrl(args.runtime)
	const sharedSecret = asOptionalString(process.env.WWW_INTERNAL_SECRET)
	const slug = asOptionalString(args.doc.slug)

	if (!sharedSecret || !slug) {
		return args.doc
	}

	const previewUrl = new URL(resolvePreviewPagePath(slug), siteUrl)
	const waitForTimeoutMs = resolveWaitForMs(seo.waitForMs)
	let result: OgGenerationResult

	try {
		const screenshot = await captureScreenshot({
			height: 630,
			logger: args.runtime.logger,
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
			runtime: args.runtime,
			screenshot,
			subject: slug,
		})

		result = {
			mediaId: media.id,
			status: "ready",
		}
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error)
		args.runtime.logger.error?.(
			`OG image generation failed for page ${args.doc.id} (slug: ${slug}) - Error: ${errorMessage} - URL: ${previewUrl.toString()} - Wait: ${waitForTimeoutMs}ms`
		)

		if (error instanceof Error && error.stack) {
			const stackLines = error.stack.split("\n").slice(0, 3).join(" | ")
			args.runtime.logger.error?.(`Stack trace for ${args.doc.id}: ${stackLines}`)
		}

		result = {
			status: "failed",
		}
	}

	const latestDoc = await loadPageById({
		pageId: args.doc.id,
		runtime: args.runtime,
	})

	if (!latestDoc) {
		return args.doc
	}

	const latestSeo = asRecord(latestDoc.seo)
	if (asOptionalString(latestSeo.ogGenerationStatus) !== "generating") {
		return latestDoc
	}

	return await updatePageWithGenerationContext({
		data: {
			seo: {
				...latestSeo,
				ogGenerationStatus: result.status,
				...(result.mediaId
					? {
							ogImage: result.mediaId,
						}
					: {}),
			},
		},
		id: latestDoc.id,
		runtime: args.runtime,
	})
}

export async function processPageAssetsJob(args: { pageId: string }) {
	const runtime = await createPageAssetsRuntime()
	let currentDoc = await loadPageById({
		pageId: args.pageId,
		runtime,
	})

	if (!currentDoc) {
		return
	}

	currentDoc = await markGeneratingPageAssets({
		doc: currentDoc,
		runtime,
	})

	currentDoc = await processGeneratingPreviewBlocks({
		doc: currentDoc,
		runtime,
	})

	currentDoc = await processGeneratingOgImage({
		doc: currentDoc,
		runtime,
	})

	try {
		await triggerFrontendRevalidation({
			currentSlug: currentDoc.slug,
			runtime,
		})
	} catch {
		// Best effort only. Content changes are still persisted even if revalidation fails.
	}
}
