export type PublicationCollection = "posts" | "pages" | "tags" | "series" | "media"
export type NativeStatus = "draft" | "published" | null
export type PublicationPlan = {
	decision: "keep" | "update" | "review"
	targetStatus?: "draft" | "published"
	progress?: "planned" | "in-progress" | "completed" | "on-hold"
	reason?: string
}

type Input = {
	collection: PublicationCollection
	legacyStatus?: string | null
	nativeStatus?: NativeStatus
	isLegacyRecord: boolean
	hasChangedSinceCutoff?: boolean
	hasNewerDraft?: boolean
	currentProgress?: string | null
}

const PROGRESS: Record<string, NonNullable<PublicationPlan["progress"]>> = {
	draft: "planned",
	"in-progress": "in-progress",
	completed: "completed",
	"on-hold": "on-hold",
}

export function planPublication(input: Input): PublicationPlan {
	const nativeStatus = input.nativeStatus ?? null
	if (input.collection === "posts") {
		if (!input.isLegacyRecord)
			return nativeStatus
				? { decision: "keep" }
				: { decision: "review", reason: "A new Post is missing native publication state." }
		if (input.legacyStatus === "published") {
			if (nativeStatus === "published") return { decision: "keep" }
			return { decision: "review", reason: "An exposed Post needs an approved published snapshot." }
		}
		if (input.legacyStatus === "draft" || input.legacyStatus === "archived") {
			if (nativeStatus === "published" && input.hasChangedSinceCutoff !== false)
				return {
					decision: "review",
					reason: "A changed Post has conflicting legacy and native publication states.",
				}
			return nativeStatus === "draft"
				? { decision: "keep" }
				: { decision: "update", targetStatus: "draft" }
		}
		return { decision: "review", reason: "Unknown Post publication state." }
	}
	if (input.collection === "pages") {
		if (!input.isLegacyRecord)
			return nativeStatus
				? { decision: "keep" }
				: { decision: "review", reason: "A new Page is missing native publication state." }
		if (input.legacyStatus !== "draft" && input.legacyStatus !== "published") {
			return { decision: "review", reason: "Unknown Page publication state." }
		}
		const targetStatus = input.legacyStatus
		if (nativeStatus === targetStatus) return { decision: "keep" }
		if (
			targetStatus === "draft" &&
			nativeStatus === "published" &&
			input.hasChangedSinceCutoff !== false
		)
			return {
				decision: "review",
				reason: "A changed Page has conflicting legacy and native publication states.",
			}
		if (targetStatus === "published") {
			return {
				decision: "review",
				reason: "A published Page needs an approved snapshot before backfill.",
			}
		}
		return { decision: "update", targetStatus }
	}
	if (input.collection === "series") {
		if (!input.isLegacyRecord) return { decision: "keep" }
		const progress = input.legacyStatus ? PROGRESS[input.legacyStatus] : undefined
		if (!progress) return { decision: "review", reason: "Unknown Series progress state." }
		if (input.currentProgress && input.currentProgress !== progress) {
			return {
				decision: "review",
				reason: "Existing Series progress conflicts with the legacy value.",
			}
		}
		if (nativeStatus === "published" && input.currentProgress === progress)
			return { decision: "keep" }
		if (input.hasNewerDraft !== false)
			return {
				decision: "review",
				reason: "A Series draft or unverified version must not be published during backfill.",
			}
		return { decision: "update", targetStatus: "published", progress }
	}
	if (!input.isLegacyRecord) return { decision: "keep" }
	if (nativeStatus === "published") return { decision: "keep" }
	if (input.hasNewerDraft !== false)
		return {
			decision: "review",
			reason: "A draft or unverified version must not be published during backfill.",
		}
	return { decision: "update", targetStatus: "published" }
}
