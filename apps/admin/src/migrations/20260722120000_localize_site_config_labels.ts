import type { MigrateDownArgs, MigrateUpArgs } from "@payloadcms/db-mongodb"

import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "@repo/i18n"

type TransformResult = {
	changedPaths: string[]
	document: Record<string, unknown>
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

const COLLECTION_NAME = "site-config"
const SUPPORTED_LOCALE_SET = new Set<string>(SUPPORTED_LOCALES)

function isRecord(value: unknown): value is Record<string, unknown> {
	return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function isLocalizedShape(value: unknown): value is Record<string, unknown> {
	if (!isRecord(value)) return false
	const keys = Object.keys(value)
	return keys.length > 0 && keys.every((key) => SUPPORTED_LOCALE_SET.has(key))
}

function transformValue(value: unknown, wrap: boolean): { changed: boolean; value: unknown } {
	if (value === undefined || value === null) return { changed: false, value }

	if (wrap) {
		return isLocalizedShape(value)
			? { changed: false, value }
			: { changed: true, value: { [DEFAULT_LOCALE]: value } }
	}

	if (!isLocalizedShape(value) || !(DEFAULT_LOCALE in value)) {
		return { changed: false, value }
	}

	return { changed: true, value: value[DEFAULT_LOCALE] }
}

function transformArrayLabels(
	document: Record<string, unknown>,
	groupName: string,
	fieldName: string,
	wrap: boolean
): boolean {
	const group = document[groupName]
	if (!isRecord(group)) return false

	const rows = group[fieldName]
	if (!Array.isArray(rows)) return false

	let changed = false
	for (const row of rows) {
		if (!isRecord(row)) continue
		const result = transformValue(row.label, wrap)
		if (!result.changed) continue
		row.label = result.value
		changed = true
	}

	return changed
}

export function transformSiteConfigLabels(
	doc: Record<string, unknown>,
	wrap: boolean
): TransformResult {
	const document = structuredClone(doc)
	const changedPaths: string[] = []

	if (transformArrayLabels(document, "navigation", "menuItems", wrap)) {
		changedPaths.push("navigation.menuItems")
	}

	const footer = document.footer
	if (isRecord(footer)) {
		const copyright = transformValue(footer.copyrightText, wrap)
		if (copyright.changed) {
			footer.copyrightText = copyright.value
			changedPaths.push("footer.copyrightText")
		}
	}

	if (transformArrayLabels(document, "footer", "additionalLinks", wrap)) {
		changedPaths.push("footer.additionalLinks")
	}

	return { changedPaths, document }
}

function getNested(document: Record<string, unknown>, path: string): unknown {
	let cursor: unknown = document
	for (const segment of path.split(".")) {
		if (!isRecord(cursor)) return undefined
		cursor = cursor[segment]
	}
	return cursor
}

async function migrate(
	db: MongoLikeDb,
	wrap: boolean
): Promise<{ scanned: number; updated: number }> {
	const collection = db.collection(COLLECTION_NAME)
	let scanned = 0
	let updated = 0

	for await (const document of collection.find({})) {
		scanned += 1
		const result = transformSiteConfigLabels(document, wrap)
		if (result.changedPaths.length === 0) continue

		const updates = Object.fromEntries(
			result.changedPaths.map((path) => [path, getNested(result.document, path)])
		)
		await collection.updateOne({ _id: document._id }, { $set: updates })
		updated += 1
	}

	return { scanned, updated }
}

export async function up({ payload }: MigrateUpArgs): Promise<void> {
	const db = payload.db.connection.db as unknown as MongoLikeDb | undefined
	if (!db) throw new Error("MongoDB connection not available")

	const exists = await db.listCollections({ name: COLLECTION_NAME }).toArray()
	if (exists.length === 0) {
		payload.logger.info(`[migrate up] Skipping ${COLLECTION_NAME} (collection does not exist)`)
		return
	}

	const { scanned, updated } = await migrate(db, true)
	payload.logger.info(
		`[migrate up] ${COLLECTION_NAME} labels: scanned=${scanned} normalized=${updated}`
	)
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
	const db = payload.db.connection.db as unknown as MongoLikeDb | undefined
	if (!db) throw new Error("MongoDB connection not available")

	const exists = await db.listCollections({ name: COLLECTION_NAME }).toArray()
	if (exists.length === 0) return

	const { scanned, updated } = await migrate(db, false)
	payload.logger.info(
		`[migrate down] ${COLLECTION_NAME} labels: scanned=${scanned} restored=${updated}`
	)
}
