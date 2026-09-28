import type { MigrateDownArgs, MigrateUpArgs } from "@payloadcms/db-mongodb"

// The previous handwriting timeline ended at 7.5 seconds with speed = 1.
const LEGACY_HANDWRITING_DURATION = 7.5
const CHILD_FIELDS = ["children", "actionBlocks", "contentBlocks", "footerBlocks"] as const

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === "object" && !Array.isArray(value)
}

function isPositiveNumber(value: unknown): value is number {
	return typeof value === "number" && Number.isFinite(value) && value > 0
}

function cloneBlocks(value: unknown): unknown {
	if (!Array.isArray(value)) return value
	return value.map((block: unknown) => {
		if (!isRecord(block)) return block
		const copy = { ...block }
		if (block.blockType === "heatmap" && isRecord(block.display)) {
			copy.display = { ...block.display }
		}
		for (const field of CHILD_FIELDS) {
			if (Array.isArray(block[field])) copy[field] = cloneBlocks(block[field])
		}
		return copy
	})
}

export function transformAnimationDurations(structure: unknown, up: boolean) {
	// Clone only the containers we edit, preserving BSON IDs and other unrelated values.
	const result = cloneBlocks(structure)
	let changed = false

	function visit(blocks: unknown) {
		if (!Array.isArray(blocks)) return
		for (const block of blocks) {
			if (!isRecord(block)) continue
			if (block.blockType === "handWriting") {
				if (up && block.duration === undefined) {
					const speed = isPositiveNumber(block.speed) ? block.speed : 1
					block.duration = LEGACY_HANDWRITING_DURATION / speed
					changed = true
				} else if (!up && block.duration !== undefined) {
					if (block.speed === undefined && isPositiveNumber(block.duration)) {
						block.speed = LEGACY_HANDWRITING_DURATION / block.duration
					}
					delete block.duration
					changed = true
				}
			}
			if (block.blockType === "heatmap" && isRecord(block.display)) {
				const display = block.display
				if (up && display.duration === undefined && isPositiveNumber(display.animateFill)) {
					display.duration = display.animateFill
					changed = true
				} else if (!up && display.duration !== undefined) {
					if (display.animateFill === undefined) display.animateFill = display.duration
					delete display.duration
					changed = true
				}
			}
			for (const field of CHILD_FIELDS) visit(block[field])
		}
	}

	visit(result)
	return { structure: result, changed }
}

type MongoLikeDb = {
	collection: (name: string) => {
		find: (filter: Record<string, unknown>) => AsyncIterable<Record<string, unknown>>
		updateOne: (
			filter: Record<string, unknown>,
			update: Record<string, unknown>
		) => Promise<{ matchedCount: number }>
	}
	listCollections: (filter: { name: string }) => { toArray: () => Promise<unknown[]> }
}

async function migrate(payload: MigrateUpArgs["payload"], forward: boolean) {
	const db = payload.db.connection.db as unknown as MongoLikeDb | undefined
	if (!db) throw new Error("MongoDB connection not available")

	for (const name of ["pages", "_pages_versions"] as const) {
		if ((await db.listCollections({ name }).toArray()).length === 0) continue
		const collection = db.collection(name)
		const path = name === "pages" ? "structure" : "version.structure"
		let updated = 0
		for await (const document of collection.find({ [path]: { $exists: true } })) {
			const original =
				name === "pages"
					? document.structure
					: isRecord(document.version)
						? document.version.structure
						: undefined
			const result = transformAnimationDurations(original, forward)
			if (!result.changed) continue
			// Match the original structure as well as the ID to avoid overwriting concurrent edits.
			const write = await collection.updateOne(
				{ _id: document._id, [path]: original },
				{ $set: { [path]: result.structure } }
			)
			if (write.matchedCount !== 1) {
				throw new Error("Page structure changed during animation migration; retry the migration")
			}
			updated += 1
		}
		payload.logger.info(`[animation duration migration] ${name}: updated=${updated}`)
	}
}

export async function up({ payload }: MigrateUpArgs): Promise<void> {
	await migrate(payload, true)
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
	await migrate(payload, false)
}
