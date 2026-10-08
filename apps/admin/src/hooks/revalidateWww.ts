import type {
	CollectionAfterChangeHook,
	CollectionAfterDeleteHook,
	CollectionBeforeChangeHook,
	CollectionBeforeDeleteHook,
	GlobalAfterChangeHook,
} from "payload"

import { isSupportedLocale, type SupportedLocale } from "@repo/i18n"

import { enqueueRevalidation } from "@/services/revalidation/dispatcher"

type ContentCollection = "posts" | "pages" | "categories" | "series" | "media"
type PublicSnapshot = { status: string | null; updatedAt: string | null; slug?: string | null }
const SNAPSHOT_KEY = "publicRevalidationSnapshots"

export function shouldRevalidatePublicChange(
	before: PublicSnapshot | null,
	after: PublicSnapshot | null
): boolean {
	if (before?.status !== "published" && after?.status !== "published") return false
	return before?.status !== after?.status || before?.updatedAt !== after?.updatedAt
}

async function readPublicSnapshot(
	req: Parameters<CollectionAfterChangeHook>[0]["req"],
	collection: ContentCollection,
	id: string
): Promise<PublicSnapshot | null> {
	const doc = await req.payload.findByID({
		collection,
		id,
		draft: false,
		depth: 0,
		overrideAccess: true,
		disableErrors: true,
		req,
	})
	if (!doc) return null
	return {
		status: doc._status ?? null,
		updatedAt: doc.updatedAt ?? null,
		slug:
			doc._status === "published" && "slug" in doc && typeof doc.slug === "string"
				? doc.slug
				: null,
	}
}

export function capturePublicDeleteSnapshot(
	collection: ContentCollection
): CollectionBeforeDeleteHook {
	return async ({ id, req }) => {
		const snapshots = (req.context[SNAPSHOT_KEY] ?? {}) as Record<string, PublicSnapshot | null>
		snapshots[`${collection}:${id}`] = await readPublicSnapshot(req, collection, String(id))
		req.context[SNAPSHOT_KEY] = snapshots
	}
}

export function capturePublicSnapshot(collection: ContentCollection): CollectionBeforeChangeHook {
	return async ({ originalDoc, req }) => {
		const id = typeof originalDoc?.id === "string" ? originalDoc.id : null
		if (!id) return
		const snapshots = (req.context[SNAPSHOT_KEY] ?? {}) as Record<string, PublicSnapshot | null>
		snapshots[`${collection}:${id}`] = await readPublicSnapshot(req, collection, id)
		req.context[SNAPSHOT_KEY] = snapshots
	}
}

function resolveLocales(locale: unknown): SupportedLocale[] | undefined {
	return isSupportedLocale(locale) ? [locale] : undefined
}

function sharedFieldsChanged(
	doc: Record<string, unknown>,
	previousDoc: Record<string, unknown> | undefined,
	fields: readonly string[]
): boolean {
	return fields.some((field) => JSON.stringify(doc[field]) !== JSON.stringify(previousDoc?.[field]))
}

export function createRevalidationHook(
	collection: ContentCollection,
	sharedFields: readonly string[] = []
): CollectionAfterChangeHook {
	return async ({ doc, previousDoc, req }) => {
		const id = String(doc.id)
		const snapshots = req.context[SNAPSHOT_KEY] as Record<string, PublicSnapshot | null> | undefined
		const before = snapshots?.[`${collection}:${id}`] ?? null
		const after = await readPublicSnapshot(req, collection, id)
		if (!shouldRevalidatePublicChange(before, after)) return doc

		const slugs = [doc?.slug, previousDoc?.slug, before?.slug, after?.slug]
			.filter((s): s is string => typeof s === "string" && s.trim().length > 0)
			.filter((s, i, arr) => arr.indexOf(s) === i)

		const publishingDraft = sharedFields.length > 0 && previousDoc?._status === "draft"
		const sharedChange =
			before?.status !== after?.status ||
			before?.slug !== after?.slug ||
			publishingDraft ||
			sharedFieldsChanged(doc, previousDoc, sharedFields)
		await enqueueRevalidation(
			req,
			collection,
			slugs,
			sharedChange ? undefined : resolveLocales(req.locale)
		)

		return doc
	}
}

export function createRevalidationDeleteHook(
	collection: ContentCollection
): CollectionAfterDeleteHook {
	return async ({ doc, req }) => {
		const snapshots = req.context?.[SNAPSHOT_KEY] as
			| Record<string, PublicSnapshot | null>
			| undefined
		const key = `${collection}:${doc.id}`
		const before = snapshots?.[key]
		const wasPublished =
			snapshots && key in snapshots ? before?.status === "published" : doc._status === "published"
		if (!wasPublished) return doc
		const slugs = [
			...new Set(
				[doc.slug, before?.slug].filter((slug): slug is string => typeof slug === "string")
			),
		]
		await enqueueRevalidation(req, collection, slugs)
		return doc
	}
}

export function createGlobalRevalidationHook(
	globalSlug: "site-config",
	sharedFields: readonly string[] = []
): GlobalAfterChangeHook {
	return async ({ doc, previousDoc, req }) => {
		const locales = sharedFieldsChanged(doc, previousDoc, sharedFields)
			? undefined
			: resolveLocales(req.locale)
		await enqueueRevalidation(req, globalSlug, [], locales)

		return doc
	}
}
