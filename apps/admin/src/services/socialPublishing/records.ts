import type { PayloadRequest } from "payload"
import type { PublicationSourceSnapshot, PreparedPlatformPayload, RemoteResult } from "./types"
import { SocialPublishingError, safeError } from "./types"
import { hashSnapshot } from "./snapshot"
import type { PublicationStatus } from "./state"
import { getSocialPublisherAdapter } from "./adapters/registry"

export type PublicationRecord = {
	id: string
	account: string
	sourcePost: string
	sourceLocale: PublicationSourceSnapshot["locale"]
	sourceUpdatedAt: string
	sourceHash: string
	snapshotHash: string
	status: PublicationStatus
	snapshot: PublicationSourceSnapshot
	preparedPayload: PreparedPlatformPayload
	remote?: RemoteResult
	lastError?: ReturnType<typeof safeError> | null
	attempts?: Array<{
		actor: string
		entryPoint: "admin" | "mcp"
		action: string
		previousStatus: string
		nextStatus: string
		snapshotHash: string
		occurredAt: string
		error?: ReturnType<typeof safeError> | null
		result?: { draftId?: string; submissionId?: string; publicationId?: string; status?: string }
	}>
	approval?: {
		actor: string
		entryPoint: "admin" | "mcp"
		snapshotHash: string
		occurredAt: string
	}
	statusChecks?: number
	nextCheckAt?: string | null
	claimExpiresAt?: string | null
}

export function verifySnapshot(doc: PublicationRecord) {
	if (hashSnapshot({ source: doc.snapshot, prepared: doc.preparedPayload }) !== doc.snapshotHash)
		throw new SocialPublishingError("prepare", "SNAPSHOT_CORRUPT")
}

export async function readPublication(
	id: string,
	req: PayloadRequest,
	worker = false
): Promise<PublicationRecord> {
	return (await req.payload.findByID({
		collection: "social-publications",
		id,
		depth: 0,
		req,
		user: req.user,
		overrideAccess: worker,
	})) as unknown as PublicationRecord
}

// This narrow server-owned operation is called only after command authorization or a
// trusted queue claim. Payload's high-level bulk update reads before writing; the
// adapter's updateOne(where) preserves the predicate in MongoDB findOneAndUpdate.
export async function transition(
	req: PayloadRequest,
	doc: PublicationRecord,
	data: Partial<PublicationRecord> & { publishedAt?: string }
): Promise<PublicationRecord | null> {
	const previousAttempt = doc.attempts?.at(-1)
	if (data.status && data.status !== doc.status && !data.attempts && previousAttempt) {
		data = {
			...data,
			attempts: [
				...(doc.attempts ?? []),
				{
					actor: previousAttempt.actor,
					entryPoint: previousAttempt.entryPoint,
					action: "worker-transition",
					previousStatus: doc.status,
					nextStatus: data.status,
					snapshotHash: doc.snapshotHash,
					occurredAt: new Date().toISOString(),
					...(data.lastError ? { error: data.lastError } : {}),
					...(data.remote
						? {
								result: {
									draftId: data.remote.draftId,
									submissionId: data.remote.submissionId,
									publicationId: data.remote.publicationId,
									status: data.remote.status,
								},
							}
						: {}),
				},
			].slice(-50),
		}
	}
	return (await req.payload.db.updateOne({
		collection: "social-publications",
		req,
		where: {
			and: [
				{ id: { equals: doc.id } },
				{ status: { equals: doc.status } },
				{ snapshotHash: { equals: doc.snapshotHash } },
				...(doc.claimExpiresAt ? [{ claimExpiresAt: { equals: doc.claimExpiresAt } }] : []),
			],
		},
		data: { ...data, updatedAt: new Date().toISOString() },
	})) as unknown as PublicationRecord | null
}

export function publicationSummary(doc: PublicationRecord) {
	return {
		statusChecks: doc.statusChecks ?? 0,
		claimExpiresAt: doc.claimExpiresAt ?? null,
		publicationId: doc.id,
		status: doc.status,
		snapshotHash: doc.snapshotHash,
		preview: {
			title: doc.preparedPayload.title,
			summary: doc.preparedPayload.summary,
			accountId: doc.account,
			platform: doc.snapshot.platform,
			locale: doc.sourceLocale,
			canonicalUrl: doc.snapshot.canonicalUrl,
		},
		warnings: doc.preparedPayload.warnings,
		remote: doc.remote
			? {
					draftId: doc.remote.draftId,
					submissionId: doc.remote.submissionId,
					publicationId: doc.remote.publicationId,
					media: doc.remote.media,
					url: doc.remote.url,
					status: doc.remote.status,
				}
			: null,
		lastError: doc.lastError ?? null,
		capabilities: getSocialPublisherAdapter(doc.snapshot.platform).capabilities,
	}
}
