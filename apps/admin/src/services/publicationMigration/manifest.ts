import type { PublicationInventoryRow } from "./inventory"
import type { NativeStatus, PublicationCollection, PublicationPlan } from "./plan"

export type PublicationAction = {
	collection: PublicationCollection
	id: string
	expected: {
		updatedAt: string
		nativeStatus: NativeStatus
		legacyStatus: string | null
		progress: string | null
	}
	target: {
		nativeStatus: "draft" | "published"
		progress?: NonNullable<PublicationPlan["progress"]>
	}
}

export function buildPublicationManifest(rows: readonly PublicationInventoryRow[]): {
	actions: PublicationAction[]
	blocked: Array<{ collection: PublicationCollection; id: string; reason: string }>
} {
	const actions: PublicationAction[] = []
	const blocked: Array<{ collection: PublicationCollection; id: string; reason: string }> = []
	const seen = new Set<string>()
	for (const row of rows) {
		const key = `${row.collection}:${row.id}`
		if (seen.has(key)) {
			blocked.push({
				collection: row.collection,
				id: row.id,
				reason: "Duplicate inventory record.",
			})
			continue
		}
		seen.add(key)
		if (row.plan.decision === "review") {
			blocked.push({
				collection: row.collection,
				id: row.id,
				reason: row.plan.reason ?? "Editorial review required.",
			})
			continue
		}
		if (!row.updatedAt || !Number.isFinite(Date.parse(row.updatedAt))) {
			blocked.push({
				collection: row.collection,
				id: row.id,
				reason: "A current timestamp is required.",
			})
			continue
		}
		if (row.plan.decision === "keep") continue
		if (!row.plan.targetStatus) {
			blocked.push({
				collection: row.collection,
				id: row.id,
				reason: "A target status is required.",
			})
			continue
		}
		actions.push({
			collection: row.collection,
			id: row.id,
			expected: {
				updatedAt: row.updatedAt,
				nativeStatus: row.nativeStatus,
				legacyStatus: row.legacyStatus,
				progress: row.progress,
			},
			target: {
				nativeStatus: row.plan.targetStatus,
				...(row.plan.progress ? { progress: row.plan.progress } : {}),
			},
		})
	}
	return { actions: blocked.length > 0 ? [] : actions, blocked }
}

export function planPublicationRollback(
	action: PublicationAction,
	afterUpdatedAt: string,
	current: { updatedAt: string; nativeStatus: NativeStatus; progress: string | null }
):
	| { decision: "restore"; target: { nativeStatus: NativeStatus; progress: string | null } }
	| { decision: "conflict" } {
	if (
		current.updatedAt !== afterUpdatedAt ||
		current.nativeStatus !== action.target.nativeStatus ||
		current.progress !== (action.target.progress ?? action.expected.progress)
	)
		return { decision: "conflict" }
	return {
		decision: "restore",
		target: { nativeStatus: action.expected.nativeStatus, progress: action.expected.progress },
	}
}
