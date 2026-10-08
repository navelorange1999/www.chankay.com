import type { CollectionBeforeChangeHook, GlobalBeforeChangeHook, PayloadRequest } from "payload"
import {
	getPublicationWhere,
	publicationCompatibilityCutoff,
} from "@/services/publicationCompatibility"

function asRecord(value: unknown): Record<string, unknown> {
	return value && typeof value === "object" && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: {}
}

function mediaId(value: unknown): string | null {
	if (typeof value === "string" && value) return value
	const id = asRecord(value).id
	return typeof id === "string" && id ? id : null
}

function pageMediaReferences(page: Record<string, unknown>): Array<{ path: string; id: string }> {
	const references: Array<{ path: string; id: string }> = []
	const ogImage = mediaId(asRecord(page.seo).ogImage)
	if (ogImage) references.push({ path: "seo.ogImage", id: ogImage })
	function visit(blocks: unknown, path: string) {
		if (!Array.isArray(blocks)) return
		blocks.forEach((entry, index) => {
			const block = asRecord(entry)
			const blockPath = `${path}.${index}`
			const field =
				block.blockType === "mediaImage"
					? "media"
					: block.blockType === "previewUrl"
						? "previewImage"
						: null
			if (field) {
				const id = mediaId(block[field])
				if (id) references.push({ path: `${blockPath}.${field}`, id })
			}
			visit(block.children, `${blockPath}.children`)
			visit(block.contentBlocks, `${blockPath}.contentBlocks`)
		})
	}
	visit(page.structure, "structure")
	return references
}

async function assertPublishedMedia(
	req: PayloadRequest,
	references: Array<{ path: string; id: string }>
) {
	const checked = new Set<string>()
	for (const reference of references) {
		if (checked.has(reference.id)) continue
		checked.add(reference.id)
		const published = publicationCompatibilityCutoff()
			? (
					await req.payload.find({
						collection: "media",
						where: { and: [{ id: { equals: reference.id } }, getPublicationWhere("media")] },
						draft: false,
						depth: 0,
						limit: 1,
						overrideAccess: true,
						req,
					})
				).docs.length > 0
			: (
					await req.payload.findByID({
						collection: "media",
						id: reference.id,
						draft: false,
						depth: 0,
						overrideAccess: true,
						disableErrors: true,
						req,
					})
				)?._status === "published"
		if (!published) {
			throw new Error(`Publish the media referenced at ${reference.path} before saving.`)
		}
	}
}

export const validatePagePublication: CollectionBeforeChangeHook = async ({
	data,
	originalDoc,
	req,
}) => {
	if (data?._status !== "published") return data
	const existing = asRecord(originalDoc)
	const incoming = asRecord(data)
	const page = {
		...existing,
		...incoming,
		seo: incoming.seo === null ? {} : { ...asRecord(existing.seo), ...asRecord(incoming.seo) },
	}
	await assertPublishedMedia(req, pageMediaReferences(page))
	return data
}

export const validateSiteConfigMedia: GlobalBeforeChangeHook = async ({
	data,
	originalDoc,
	req,
}) => {
	const config = { ...asRecord(originalDoc), ...asRecord(data) }
	const references = ["logo", "favicon", "appleTouchIcon", "ogImage"]
		.map((path) => ({ path, id: mediaId(config[path]) }))
		.filter((reference): reference is { path: string; id: string } => reference.id !== null)
	await assertPublishedMedia(req, references)
	return data
}
