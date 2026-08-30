/**
 * Move localization from the `pages.structure` container down to the leaf text
 * fields inside each block.
 *
 * Previously, `structure` itself was `localized: true`, which forced editors
 * to maintain a per-locale copy of the entire blocks tree. With `fallback`
 * enabled the admin form would prefill the target locale from the default
 * locale, then write that fallback back to storage on save, defeating the
 * fallback. The fix is to localize the leaf text fields (text.content,
 * markdown.content, button.label, card.title, card.description) instead, and
 * keep the layout shared across locales.
 *
 * `up` therefore:
 *   1. If `structure` is `{ en: [...] }`, flatten the outer wrapper.
 *   2. Walk the resulting blocks tree and wrap each leaf text field in
 *      `{ [DEFAULT_LOCALE]: value }` if it is still a bare value.
 *
 * `down` is the symmetric inverse so the prior migration's shape is restored.
 *
 * The migration is idempotent: blocks already in the target shape are skipped.
 */

import type { MigrateUpArgs, MigrateDownArgs } from "@payloadcms/db-mongodb"

import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "@repo/i18n"

const SUPPORTED_LOCALE_SET = new Set<string>(SUPPORTED_LOCALES)

const LEAF_TEXT_FIELDS: Record<string, readonly string[]> = {
	text: ["content"],
	markdown: ["content"],
	button: ["label"],
	card: ["title", "description"],
}

const CHILD_ARRAY_FIELDS = ["children", "actionBlocks", "contentBlocks", "footerBlocks"] as const

const PAGES_COLLECTIONS = ["pages", "_pages_versions"] as const

function isLocalizedShape(value: unknown): boolean {
	if (!value || typeof value !== "object" || Array.isArray(value)) return false
	const keys = Object.keys(value as Record<string, unknown>)
	if (keys.length === 0) return false
	return keys.every((key) => SUPPORTED_LOCALE_SET.has(key))
}

function transformBlock(block: Record<string, unknown>, wrap: boolean): boolean {
	let dirty = false
	const blockType = block.blockType
	const targets = typeof blockType === "string" ? LEAF_TEXT_FIELDS[blockType] : undefined

	if (targets) {
		for (const field of targets) {
			const value = block[field]
			if (value === undefined) continue

			if (wrap) {
				if (isLocalizedShape(value)) continue
				block[field] = { [DEFAULT_LOCALE]: value }
				dirty = true
			} else {
				if (!isLocalizedShape(value)) continue
				const localized = value as Record<string, unknown>
				if (!(DEFAULT_LOCALE in localized)) continue
				block[field] = localized[DEFAULT_LOCALE]
				dirty = true
			}
		}
	}

	for (const childField of CHILD_ARRAY_FIELDS) {
		const children = block[childField]
		if (!Array.isArray(children)) continue
		for (const child of children) {
			if (!child || typeof child !== "object" || Array.isArray(child)) continue
			if (transformBlock(child as Record<string, unknown>, wrap)) dirty = true
		}
	}

	return dirty
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

function readStructure(doc: Record<string, unknown>, isVersion: boolean): unknown {
	if (!isVersion) return doc.structure
	const version = doc.version
	if (!version || typeof version !== "object" || Array.isArray(version)) return undefined
	return (version as Record<string, unknown>).structure
}

function structurePath(isVersion: boolean): string {
	return isVersion ? "version.structure" : "structure"
}

async function migrate(
	db: MongoLikeDb,
	collectionName: string,
	wrap: boolean
): Promise<{ scanned: number; updated: number }> {
	const isVersion = collectionName === "_pages_versions"
	const collection = db.collection(collectionName)
	const cursor = collection.find({})
	let scanned = 0
	let updated = 0

	for await (const rawDoc of cursor) {
		scanned += 1
		const doc = rawDoc as Record<string, unknown>
		const structure = readStructure(doc, isVersion)
		if (structure === undefined || structure === null) continue

		let nextStructure: unknown = structure
		let dirty = false

		if (wrap) {
			if (isLocalizedShape(nextStructure)) {
				const outer = nextStructure as Record<string, unknown>
				const inner = outer[DEFAULT_LOCALE]
				if (Array.isArray(inner)) {
					nextStructure = inner
					dirty = true
				} else {
					continue
				}
			}

			if (!Array.isArray(nextStructure)) continue

			for (const block of nextStructure) {
				if (!block || typeof block !== "object" || Array.isArray(block)) continue
				if (transformBlock(block as Record<string, unknown>, true)) dirty = true
			}

			if (!dirty) continue
			await collection.updateOne(
				{ _id: doc._id },
				{ $set: { [structurePath(isVersion)]: nextStructure } }
			)
			updated += 1
			continue
		}

		if (!Array.isArray(nextStructure)) continue

		for (const block of nextStructure) {
			if (!block || typeof block !== "object" || Array.isArray(block)) continue
			if (transformBlock(block as Record<string, unknown>, false)) dirty = true
		}

		await collection.updateOne(
			{ _id: doc._id },
			{ $set: { [structurePath(isVersion)]: { [DEFAULT_LOCALE]: nextStructure } } }
		)
		updated += 1
	}

	return { scanned, updated }
}

export async function up({ payload }: MigrateUpArgs): Promise<void> {
	const db = payload.db.connection.db as unknown as MongoLikeDb | undefined
	if (!db) throw new Error("MongoDB connection not available")

	for (const collectionName of PAGES_COLLECTIONS) {
		const exists = await db.listCollections({ name: collectionName }).toArray()
		if (exists.length === 0) {
			payload.logger.info(
				`[migrate up] Skipping ${collectionName} (collection does not exist)`
			)
			continue
		}

		const { scanned, updated } = await migrate(db, collectionName, true)
		payload.logger.info(
			`[migrate up] ${collectionName}: scanned=${scanned} relocated=${updated}`
		)
	}
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
	const db = payload.db.connection.db as unknown as MongoLikeDb | undefined
	if (!db) throw new Error("MongoDB connection not available")

	for (const collectionName of PAGES_COLLECTIONS) {
		const exists = await db.listCollections({ name: collectionName }).toArray()
		if (exists.length === 0) continue

		const { scanned, updated } = await migrate(db, collectionName, false)
		payload.logger.info(
			`[migrate down] ${collectionName}: scanned=${scanned} restored=${updated}`
		)
	}
}
