export const publicationStatuses = [
	"preparing",
	"prepared",
	"draft_queued",
	"draft_creating",
	"draft_ready",
	"publish_queued",
	"publishing",
	"status_check_queued",
	"status_checking",
	"published",
	"failed",
	"unknown",
	"cancelled",
] as const
export type PublicationStatus = (typeof publicationStatuses)[number]
export type QueueAction = "create-draft" | "publish" | "status-check"
export type QueueMessage = { action: QueueAction; publicationId: string }

type StateRecord = {
	status: string
	statusChecks?: number
	claimExpiresAt?: string | null
	remote?: {
		draftId?: string
		submissionId?: string
		publicationId?: string
		url?: string
		status?: string
		media?: Record<string, unknown> | null
	} | null
	lastError?: { stage?: string; code?: string; retryable?: boolean; ambiguous?: boolean } | null
}

export function canRetryDraftAfterConnectivityFix(doc: StateRecord): boolean {
	const remote = doc.remote
	return (
		doc.status === "failed" &&
		doc.lastError?.stage === "token" &&
		doc.lastError.code === "40164" &&
		doc.lastError.ambiguous === false &&
		!remote?.draftId &&
		!remote?.submissionId &&
		!remote?.publicationId &&
		!remote?.url &&
		!remote?.status &&
		(!remote?.media || Object.keys(remote.media).length === 0)
	)
}

export function canRetryDraftAfterRemoteInspection(doc: StateRecord): boolean {
	return (
		doc.status === "unknown" &&
		doc.lastError?.ambiguous === true &&
		["media", "create-draft"].includes(doc.lastError.stage ?? "") &&
		!doc.remote?.draftId &&
		!doc.remote?.submissionId &&
		!doc.remote?.publicationId &&
		!doc.remote?.url &&
		!doc.remote?.status
	)
}

export function recoveryAction(doc: StateRecord): "create-draft" | "publish" | null {
	if (doc.status === "draft_queued") return "create-draft"
	if (doc.status === "publish_queued" || doc.status === "status_check_queued") return "publish"
	if (doc.status === "unknown" && doc.remote?.submissionId && (doc.statusChecks ?? 0) < 10)
		return "publish"
	if (doc.claimExpiresAt && Date.parse(doc.claimExpiresAt) <= Date.now()) {
		if (doc.status === "draft_creating") return "create-draft"
		if (doc.status === "publishing" || doc.status === "status_checking") return "publish"
	}
	return null
}

export function canQueue(
	doc: StateRecord,
	action: QueueAction,
	remoteDraft: "required" | "optional" | "unsupported" = "required"
): boolean {
	if (action === "status-check")
		return doc.status === "unknown" && Boolean(doc.remote?.submissionId)
	if (doc.remote?.publicationId || doc.remote?.submissionId) return false
	if (action === "create-draft" && remoteDraft === "unsupported") return false
	if (action === "create-draft" && doc.remote?.draftId) return false
	if (action === "create-draft" && doc.status === "prepared") return true
	if (action === "create-draft" && canRetryDraftAfterConnectivityFix(doc)) return true
	if (action === "publish" && doc.status === "prepared" && remoteDraft !== "required") return true
	if (action === "publish" && doc.status === "draft_ready" && doc.remote?.draftId) return true
	if (doc.status !== "failed" || !doc.lastError?.retryable || doc.lastError.ambiguous) return false
	return action === "publish"
		? doc.lastError.stage === "publish"
		: ["token", "media", "create-draft"].includes(doc.lastError.stage ?? "")
}

export function claimState(action: QueueAction): [PublicationStatus, PublicationStatus] {
	return action === "create-draft"
		? ["draft_queued", "draft_creating"]
		: action === "publish"
			? ["publish_queued", "publishing"]
			: ["status_check_queued", "status_checking"]
}
