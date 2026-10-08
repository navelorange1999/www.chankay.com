import type { CollectionBeforeChangeHook } from "payload"
import {
	getPublicationWhere,
	isLegacyPublicationRecord,
	publicationCompatibilityCutoff,
} from "@/services/publicationCompatibility"

function asRecord(value: unknown): Record<string, unknown> {
	return value && typeof value === "object" && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: {}
}

function relationIds(value: unknown): string[] {
	const values = Array.isArray(value) ? value : value == null ? [] : [value]
	return values.flatMap((entry) => {
		if (typeof entry === "string") return [entry]
		if (entry && typeof entry === "object" && "id" in entry && typeof entry.id === "string")
			return [entry.id]
		return []
	})
}

export const validatePostPublication: CollectionBeforeChangeHook = async ({
	data,
	originalDoc,
	operation,
	req,
}) => {
	if (data?._status !== "published") return data
	const field = (name: string): unknown => (name in data ? data[name] : originalDoc?.[name])
	const category = relationIds(field("category"))[0]
	const meta = data.meta === null ? {} : { ...asRecord(originalDoc?.meta), ...asRecord(data.meta) }
	const mayDeferCategory =
		operation !== "create" &&
		Boolean(originalDoc?.id) &&
		isLegacyPublicationRecord(originalDoc) &&
		(relationIds(originalDoc?.category).length === 0 ||
			(Boolean(req.user) &&
				req.context?.contentMigrationRollback === true &&
				data.category === null))
	if (!category && !mayDeferCategory) throw new Error("A published post requires a category.")
	const references: Array<{
		collection: "categories" | "tags" | "series" | "media"
		ids: string[]
	}> = [
		{ collection: "categories", ids: category ? [category] : [] },
		{ collection: "tags", ids: [...new Set(relationIds(field("tags")))] },
		{ collection: "series", ids: relationIds(field("series")) },
		{
			collection: "media",
			ids: [...new Set([...relationIds(field("featuredImage")), ...relationIds(meta.image)])],
		},
	]
	for (const { collection, ids } of references) {
		for (const id of ids) {
			const published = publicationCompatibilityCutoff()
				? (
						await req.payload.find({
							collection,
							where: { and: [{ id: { equals: id } }, getPublicationWhere(collection)] },
							draft: false,
							depth: 0,
							limit: 1,
							overrideAccess: true,
							req,
						})
					).docs.length > 0
				: (
						await req.payload.findByID({
							collection,
							id,
							draft: false,
							depth: 0,
							overrideAccess: true,
							disableErrors: true,
							req,
						})
					)?._status === "published"
			if (!published) {
				throw new Error(`A published post requires its ${collection} references to be published.`)
			}
		}
	}
	return data
}
