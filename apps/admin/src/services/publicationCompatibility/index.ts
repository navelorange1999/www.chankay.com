import type { CollectionBeforeChangeHook, Where } from "payload"

export type PublicationCollection = "posts" | "pages" | "tags" | "series" | "media" | "categories"

export function publicationCompatibilityCutoff(): string | null {
	if (process.env.CONTENT_PUBLICATION_MODE !== "compatibility") return null
	const value = process.env.CONTENT_PUBLICATION_LEGACY_BEFORE
	if (!value || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) return null
	const timestamp = Date.parse(value)
	return Number.isFinite(timestamp) && new Date(timestamp).toISOString() === value ? value : null
}

export function isLegacyPublicationRecord(record: { createdAt?: unknown } | undefined): boolean {
	const cutoff = publicationCompatibilityCutoff()
	const createdAt = typeof record?.createdAt === "string" ? Date.parse(record.createdAt) : NaN
	return cutoff !== null && Number.isFinite(createdAt) && createdAt < Date.parse(cutoff)
}

export function getPublicationWhere(collection: PublicationCollection): Where {
	const published: Where = { _status: { equals: "published" } }
	const cutoff = publicationCompatibilityCutoff()
	if (!cutoff || collection === "categories") return published
	const legacy: Where[] = [{ _status: { exists: false } }, { createdAt: { less_than: cutoff } }]
	if (collection === "posts" || collection === "pages")
		legacy.push({ status: { equals: "published" } })
	return { or: [published, { and: legacy }] }
}

/** Draft writes are version-only in Payload; this hook never writes to the main document itself. */
export const mirrorNativePublication: CollectionBeforeChangeHook = ({
	data,
	originalDoc,
	operation,
}) => {
	if (!publicationCompatibilityCutoff()) return data
	const native = data._status ?? originalDoc?._status
	const status =
		native === "published" || native === "draft"
			? native
			: operation === "create"
				? "draft"
				: originalDoc?.status
	return { ...data, status }
}
