import {
	buildVersionCollectionFields,
	flattenAllFields,
	type Field,
	type PayloadRequest,
	type SanitizedCollectionConfig,
} from "payload"
import { transform } from "@payloadcms/db-mongodb/internal"
import type { MongooseAdapter } from "@payloadcms/db-mongodb"

// Historical schema for audit hashes only. Never register it in Payload collections.
const fields: Field[] = [
	{ name: "posts", type: "join", collection: "posts", on: "tags" },
	{ name: "name", type: "text", localized: true },
	{ name: "slug", type: "text" },
	{ name: "description", type: "textarea", localized: true },
	{ name: "color", type: "text" },
	{ name: "priority", type: "number" },
	{ name: "featured", type: "checkbox" },
	{ name: "createdAt", type: "date" },
	{ name: "updatedAt", type: "date" },
	{ name: "_status", type: "select", options: ["draft", "published"] },
]
export const retiredTagConfig = {
	slug: "tags",
	fields,
	flattenedFields: flattenAllFields({ fields }),
	versions: { drafts: true, maxPerDoc: 10 },
	timestamps: true,
} as unknown as SanitizedCollectionConfig

/** Read exactly one retained Mongo record and its latest version; no live resource or writes. */
export async function readRetiredTagSnapshot(req: PayloadRequest, id: string) {
	if (!req.user) throw new Error("Authentication is required for historical Tag audits.")
	if (!/^[a-fA-F0-9]{24}$/.test(id)) throw new Error("Invalid historical Tag ID.")
	const db = req.payload.db
	const transactionID = await req.transactionID
	const session = transactionID ? db.sessions[transactionID] : undefined
	if (transactionID && (!session || !session.inTransaction()))
		throw new Error("Historical audit transaction is unavailable.")
	const objectId = new db.connection.base.Types.ObjectId(id)
	const record = await db.connection.collection("tags").findOne({ _id: objectId }, { session })
	const versions = db.connection.collection("_tags_versions")
	const latest =
		(
			await versions
				.find({ parent: objectId }, { session })
				.sort({ updatedAt: -1 })
				.limit(1)
				.toArray()
		)[0] ?? null
	const total = await versions.countDocuments({ parent: objectId }, { session })
	const adapter = Object.create(db) as MongooseAdapter
	const payload = Object.create(req.payload) as typeof req.payload
	payload.config = {
		...req.payload.config,
		collections: [...req.payload.config.collections, retiredTagConfig],
	}
	Object.defineProperty(adapter, "payload", { value: payload })
	if (record)
		transform({ adapter, data: record, fields: retiredTagConfig.fields, operation: "read" })
	if (latest)
		transform({
			adapter,
			data: latest,
			fields: buildVersionCollectionFields(payload.config, retiredTagConfig),
			operation: "read",
		})
	return { record, latest, total }
}
