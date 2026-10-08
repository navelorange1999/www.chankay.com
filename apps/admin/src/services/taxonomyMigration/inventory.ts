import type { Payload } from "payload"

import { migrationReadAdapter } from "../contentMigration/readAdapter"
import { planPostTaxonomy, type LegacyPostTaxonomy, type TaxonomyPlan } from "./plan"

const PAGE_SIZE = 200
const ID_PATTERN = /^[a-zA-Z0-9_-]{1,80}$/

function relationId(value: unknown): string | null {
	if (typeof value === "string") return value
	if (value && typeof value === "object" && "id" in value && typeof value.id === "string")
		return value.id
	return null
}

type StoredPost = {
	id: string
	updatedAt?: string | null
	status?: string | null
	_status?: string | null
	category?: unknown
	primaryTag?: unknown
	tags?: unknown
}

export type TaxonomyInventoryRow = {
	id: string
	updatedAt: string | null
	legacyStatus: string | null
	nativeStatus: string | null
	current: LegacyPostTaxonomy
	plan: TaxonomyPlan
}

async function readPublishedIds(payload: Pick<Payload, "db">, collection: "categories" | "tags") {
	const ids = new Set<string>()
	let page = 1
	let totalPages = 1
	while (page <= totalPages) {
		const result = await migrationReadAdapter(payload).find<{ id: string }>({
			collection,
			where: { _status: { equals: "published" } },
			select: { id: true },
			limit: PAGE_SIZE,
			page,
			sort: "id",
		})
		for (const record of result.docs) ids.add(String(record.id))
		totalPages = result.totalPages
		page += 1
	}
	return ids
}

async function validateMapping(
	payload: Pick<Payload, "db">,
	categoryByTagId: Readonly<Record<string, string>>
) {
	const entries = Object.entries(categoryByTagId)
	if (
		entries.some(([tagId, categoryId]) => !ID_PATTERN.test(tagId) || !ID_PATTERN.test(categoryId))
	) {
		throw new Error("Category mapping contains an invalid ID.")
	}
	const categories = await readPublishedIds(payload, "categories")
	if (entries.length === 0) return categories
	const tags = await readPublishedIds(payload, "tags")
	if (entries.some(([tagId, categoryId]) => !tags.has(tagId) || !categories.has(categoryId))) {
		throw new Error("Category mapping references an unpublished or missing Tag or Category.")
	}
	return categories
}

export async function collectTaxonomyInventory(
	payload: Pick<Payload, "db">,
	categoryByTagId: Readonly<Record<string, string>>
): Promise<TaxonomyInventoryRow[]> {
	const publishedCategories = await validateMapping(payload, categoryByTagId)
	const rows: TaxonomyInventoryRow[] = []
	let page = 1
	let totalPages = 1
	while (page <= totalPages) {
		const result = await migrationReadAdapter(payload).find<StoredPost>({
			collection: "posts",
			locale: "all",
			projection: {
				_id: true,
				updatedAt: true,
				status: true,
				_status: true,
				category: true,
				primaryTag: true,
				tags: true,
			},
			limit: PAGE_SIZE,
			page,
			sort: "id",
		})
		for (const post of result.docs) {
			const current: LegacyPostTaxonomy = {
				id: String(post.id),
				category: relationId(post.category),
				primaryTag: relationId(JSON.parse(JSON.stringify(post.primaryTag ?? null))),
				tags: Array.isArray(post.tags)
					? post.tags.map(relationId).filter((id): id is string => id !== null)
					: [],
			}
			const plan = planPostTaxonomy(current, categoryByTagId)
			const isPublic = post.status === "published" || post._status === "published"
			const hasWithdrawnCategory =
				isPublic && current.category !== null && !publishedCategories.has(current.category)
			rows.push({
				id: current.id,
				updatedAt: post.updatedAt ?? null,
				legacyStatus: post.status ?? null,
				nativeStatus: post._status ?? null,
				current,
				plan: hasWithdrawnCategory
					? {
							...plan,
							changed: false,
							reviewReason: "A public Post references a missing or unpublished Category.",
						}
					: plan,
			})
		}
		totalPages = result.totalPages
		page += 1
	}
	return rows
}
