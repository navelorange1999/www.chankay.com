import type { TaxonomyInventoryRow } from "./inventory"

export type TaxonomyAction = {
	id: string
	expected: {
		updatedAt: string
		category: string | null
		primaryTag: string | null
		tags: string[]
	}
	target: { category: string | null; tags: string[] }
}

function sameTags(a: readonly string[], b: readonly string[]) {
	return a.length === b.length && a.every((tag, index) => tag === b[index])
}

export function buildTaxonomyManifest(
	rows: readonly TaxonomyInventoryRow[],
	acceptedUncategorizedPostIds: ReadonlySet<string> = new Set()
): {
	actions: TaxonomyAction[]
	blocked: Array<{ id: string; reason: string }>
} {
	const actions: TaxonomyAction[] = []
	const blocked: Array<{ id: string; reason: string }> = []
	const seen = new Set<string>()
	for (const row of rows) {
		if (seen.has(row.id)) {
			blocked.push({ id: row.id, reason: "Duplicate inventory record." })
			continue
		}
		seen.add(row.id)
		if (row.plan.reviewReason) {
			blocked.push({ id: row.id, reason: row.plan.reviewReason })
			continue
		}
		if (
			row.plan.category === null &&
			(row.legacyStatus === "published" || row.nativeStatus === "published") &&
			!acceptedUncategorizedPostIds.has(row.id)
		) {
			blocked.push({
				id: row.id,
				reason: "A public Post needs a Category or explicit Uncategorized acceptance.",
			})
			continue
		}
		if (!row.updatedAt || !Number.isFinite(Date.parse(row.updatedAt))) {
			blocked.push({ id: row.id, reason: "A current timestamp is required." })
			continue
		}
		if (!row.plan.changed) continue
		actions.push({
			id: row.id,
			expected: {
				updatedAt: row.updatedAt,
				category: row.current.category,
				primaryTag: row.current.primaryTag,
				tags: [...row.current.tags],
			},
			target: { category: row.plan.category, tags: [...row.plan.tags] },
		})
	}
	return { actions: blocked.length > 0 ? [] : actions, blocked }
}

export function planTaxonomyRollback(
	action: TaxonomyAction,
	afterUpdatedAt: string,
	current: { updatedAt: string; category: string | null; tags: readonly string[] }
):
	| { decision: "restore"; target: { category: string | null; tags: string[] } }
	| { decision: "conflict" } {
	if (
		current.updatedAt !== afterUpdatedAt ||
		current.category !== action.target.category ||
		!sameTags(current.tags, action.target.tags)
	)
		return { decision: "conflict" }
	return {
		decision: "restore",
		target: { category: action.expected.category, tags: [...action.expected.tags] },
	}
}
