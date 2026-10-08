import type { Payload } from "payload"

import {
	planPublication,
	type NativeStatus,
	type PublicationCollection,
	type PublicationPlan,
} from "./plan"

const COLLECTIONS: PublicationCollection[] = ["posts", "pages", "tags", "series", "media"]
const PAGE_SIZE = 200

type StoredRecord = {
	id: string
	createdAt?: string | null
	updatedAt?: string | null
	status?: string | null
	_status?: string | null
	progress?: string | null
}

type StoredVersion = { _status?: string | null }

export type PublicationInventoryRow = {
	collection: PublicationCollection
	id: string
	createdAt: string | null
	updatedAt: string | null
	hasChangedSinceCutoff: boolean | null
	legacyStatus: string | null
	nativeStatus: NativeStatus
	progress: string | null
	hasNewerDraft: boolean | null
	plan: PublicationPlan
}

function nativeStatus(value: string | null | undefined): NativeStatus {
	return value === "published" || value === "draft" ? value : null
}

export async function collectPublicationInventory(
	payload: Pick<Payload, "db">,
	legacyBefore: string
): Promise<PublicationInventoryRow[]> {
	if (!Number.isFinite(Date.parse(legacyBefore)))
		throw new Error("A valid legacy cutoff is required.")
	const rows: PublicationInventoryRow[] = []
	for (const collection of COLLECTIONS) {
		let page = 1
		let totalPages = 1
		while (page <= totalPages) {
			const result = await payload.db.find<StoredRecord>({
				collection,
				locale: "all",
				select: {
					id: true,
					createdAt: true,
					updatedAt: true,
					status: true,
					_status: true,
					progress: true,
				},
				limit: PAGE_SIZE,
				page,
				sort: "id",
			})
			for (const record of result.docs) {
				const createdAt =
					typeof record.createdAt === "string" && Number.isFinite(Date.parse(record.createdAt))
						? record.createdAt
						: null
				const isLegacyRecord =
					createdAt !== null && Date.parse(createdAt) < Date.parse(legacyBefore)
				const updatedAt =
					typeof record.updatedAt === "string" && Number.isFinite(Date.parse(record.updatedAt))
						? record.updatedAt
						: null
				const hasChangedSinceCutoff =
					updatedAt === null ? null : Date.parse(updatedAt) >= Date.parse(legacyBefore)
				const legacyStatus = typeof record.status === "string" ? record.status : null
				const status = nativeStatus(record._status)
				let hasNewerDraft: boolean | null = null
				if (
					isLegacyRecord &&
					["tags", "series", "media"].includes(collection) &&
					(status !== "published" || (collection === "series" && !record.progress))
				) {
					const versions = await payload.db.findVersions<StoredVersion>({
						collection,
						where: { parent: { equals: String(record.id) } },
						select: { version: { _status: true } },
						limit: 1,
						page: 1,
						sort: "-updatedAt",
					})
					hasNewerDraft = versions.docs[0]?.version?._status === "draft"
				}
				const plan =
					createdAt === null
						? {
								decision: "review" as const,
								reason: "Missing creation time prevents legacy classification.",
							}
						: planPublication({
								collection,
								legacyStatus,
								nativeStatus: status,
								isLegacyRecord,
								hasChangedSinceCutoff: hasChangedSinceCutoff ?? undefined,
								currentProgress: record.progress,
								hasNewerDraft: hasNewerDraft ?? undefined,
							})
				rows.push({
					collection,
					id: String(record.id),
					createdAt,
					updatedAt,
					hasChangedSinceCutoff,
					legacyStatus,
					nativeStatus: status,
					progress: record.progress ?? null,
					hasNewerDraft,
					plan,
				})
			}
			totalPages = result.totalPages
			page += 1
		}
	}
	return rows
}
