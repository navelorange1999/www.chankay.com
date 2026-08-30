/**
 * Normalize legacy non-localized field values to Payload's per-locale shape.
 *
 * Payload stores localized fields as `{ [localeCode]: value }`. When a field
 * gains `localized: true` after data already exists, the existing rows still
 * hold the bare value (e.g. `title: "Hello"` instead of `title: { en: "Hello" }`),
 * causing the admin UI to display blanks.
 *
 * This migration walks every known localized field across all collections,
 * version collections, and globals, and wraps any bare value with
 * `{ [DEFAULT_LOCALE]: value }`. Documents that already have the localized
 * shape are skipped, so the migration is idempotent.
 */

import type { MigrateUpArgs, MigrateDownArgs } from "@payloadcms/db-mongodb"

import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "@repo/i18n"

type FieldPath = readonly string[]

type CollectionTarget = {
	collection: string
	filter?: Record<string, unknown>
	fields: FieldPath[]
}

const SUPPORTED_LOCALE_SET = new Set<string>(SUPPORTED_LOCALES)

const COLLECTION_TARGETS: CollectionTarget[] = [
	{
		collection: "posts",
		fields: [["title"], ["excerpt"], ["content"]],
	},
	{
		collection: "_posts_versions",
		fields: [
			["version", "title"],
			["version", "excerpt"],
			["version", "content"],
		],
	},
	{
		collection: "tags",
		fields: [["name"], ["description"]],
	},
	{
		collection: "series",
		fields: [["title"], ["description"]],
	},
	{
		collection: "pages",
		fields: [["title"], ["structure"], ["seo", "metaTitle"], ["seo", "metaDescription"]],
	},
	{
		collection: "site-config",
		fields: [
			["siteName"],
			["siteDescription"],
			["metaTitle"],
			["metaDescription"],
			["footer", "customFooterText"],
			["maintenance", "maintenanceMessage"],
		],
	},
]

function isLocalizedShape(value: unknown): boolean {
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		return false
	}
	const keys = Object.keys(value as Record<string, unknown>)
	if (keys.length === 0) {
		return false
	}
	return keys.every((key) => SUPPORTED_LOCALE_SET.has(key))
}

function getNested(doc: Record<string, unknown>, path: FieldPath): unknown {
	let cursor: unknown = doc
	for (const key of path) {
		if (cursor == null || typeof cursor !== "object" || Array.isArray(cursor)) {
			return undefined
		}
		cursor = (cursor as Record<string, unknown>)[key]
	}
	return cursor
}

type MongoLikeDb = {
	collection: (name: string) => {
		find: (filter: Record<string, unknown>) => AsyncIterable<Record<string, unknown>>
		updateOne: (
			filter: Record<string, unknown>,
			update: Record<string, unknown>
		) => Promise<unknown>
	}
	listCollections: (filter: { name: string }) => { toArray: () => Promise<unknown[]> }
}

async function normalize(
	db: MongoLikeDb,
	target: CollectionTarget,
	wrap: boolean
): Promise<{ scanned: number; updated: number }> {
	const collection = db.collection(target.collection)
	const cursor = collection.find(target.filter ?? {})
	let scanned = 0
	let updated = 0

	for await (const rawDoc of cursor) {
		scanned += 1
		const doc = rawDoc as Record<string, unknown>
		const updates: Record<string, unknown> = {}
		let dirty = false

		for (const path of target.fields) {
			const value = getNested(doc, path)
			if (value === undefined) continue
			const dotted = path.join(".")

			if (wrap) {
				if (isLocalizedShape(value)) continue
				updates[dotted] = { [DEFAULT_LOCALE]: value }
			} else {
				if (!isLocalizedShape(value)) continue
				const localized = value as Record<string, unknown>
				if (!(DEFAULT_LOCALE in localized)) continue
				updates[dotted] = localized[DEFAULT_LOCALE]
			}
			dirty = true
		}

		if (dirty) {
			await collection.updateOne({ _id: doc._id }, { $set: updates })
			updated += 1
		}
	}

	return { scanned, updated }
}

export async function up({ payload }: MigrateUpArgs): Promise<void> {
	const db = payload.db.connection.db as unknown as MongoLikeDb | undefined
	if (!db) throw new Error("MongoDB connection not available")

	for (const target of COLLECTION_TARGETS) {
		const collections = await db.listCollections({ name: target.collection }).toArray()
		if (collections.length === 0) {
			payload.logger.info(`[migrate up] Skipping ${target.collection} (collection does not exist)`)
			continue
		}

		const { scanned, updated } = await normalize(db, target, true)
		payload.logger.info(
			`[migrate up] ${target.collection}: scanned=${scanned} normalized=${updated}`
		)
	}
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
	const db = payload.db.connection.db as unknown as MongoLikeDb | undefined
	if (!db) throw new Error("MongoDB connection not available")

	for (const target of COLLECTION_TARGETS) {
		const collections = await db.listCollections({ name: target.collection }).toArray()
		if (collections.length === 0) continue

		const { scanned, updated } = await normalize(db, target, false)
		payload.logger.info(
			`[migrate down] ${target.collection}: scanned=${scanned} unwrapped=${updated}`
		)
	}
}
