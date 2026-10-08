import type { Field, FlattenedField, Payload, SanitizedCollectionConfig } from "payload"

const retiredFields: Record<string, Array<Field & FlattenedField>> = {
	posts: [
		{ name: "status", type: "select", options: ["draft", "published", "archived"] },
		{ name: "primaryTag", type: "relationship", relationTo: "tags" },
	],
	pages: [{ name: "status", type: "select", options: ["draft", "published"] }],
	series: [
		{ name: "status", type: "select", options: ["draft", "in-progress", "completed", "on-hold"] },
	],
}

/** Restore only retired fields for historical reads while retaining Payload's ordinary filtering. */
export function migrationReadAdapter(
	payload: Pick<Payload, "db">
): Pick<Payload["db"], "find" | "findVersions"> {
	const adapter = Object.create(payload.db) as Payload["db"]
	const live = payload.db.payload
	const historicalConfigs = new Map<string, SanitizedCollectionConfig>()
	const collections = Object.fromEntries(
		Object.entries(live?.collections ?? {}).map(([slug, collection]) => {
			const additions = (retiredFields[slug] ?? []).filter(
				(field) => !collection.config.flattenedFields.some((current) => current.name === field.name)
			)
			if (!additions.length) return [slug, collection]
			const config = {
				...collection.config,
				fields: [...collection.config.fields, ...additions],
				flattenedFields: [...collection.config.flattenedFields, ...additions],
			}
			historicalConfigs.set(slug, config)
			return [slug, { ...collection, config }]
		})
	) as Payload["collections"]
	const scopedPayload = Object.create(live ?? {}) as Payload
	scopedPayload.collections = collections
	scopedPayload.config = {
		...live?.config,
		collections: (live?.config?.collections ?? []).map(
			(collection) => historicalConfigs.get(collection.slug) ?? collection
		),
	}
	Object.defineProperty(adapter, "payload", { value: scopedPayload })
	return adapter
}
