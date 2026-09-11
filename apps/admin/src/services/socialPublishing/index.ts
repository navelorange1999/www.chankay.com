import type { PayloadRequest } from "payload"
import { commandRequest, requireOperator } from "./access"
import { getSocialPublisherAdapter } from "./adapters/registry"
import { enqueueSocialPublication } from "./dispatcher"
import { hashSnapshot, preparationKey } from "./snapshot"
import { loadSource } from "./source"
import {
	commandSchema,
	inspectedDraftRetrySchema,
	prepareSchema,
	relationshipID,
} from "./validation"
import {
	canQueue,
	canRetryDraftAfterRemoteInspection,
	claimState,
	recoveryAction,
	type QueueAction,
} from "./state"
import {
	readPublication,
	publicationSummary,
	transition,
	verifySnapshot,
	type PublicationRecord,
} from "./records"
import { SocialPublishingError } from "./types"

export async function prepareSocialPublication(args: unknown, req: PayloadRequest) {
	const actor = requireOperator(req)
	const input = prepareSchema.parse(args)
	const { source, sourceUpdatedAt, adapter } = await loadSource(input, req)
	const prepared = await adapter.prepare(source)
	const snapshotHash = hashSnapshot({ source, prepared })
	const idempotencyKey = preparationKey(snapshotHash)
	const find = () =>
		req.payload.find({
			collection: "social-publications",
			where: { idempotencyKey: { equals: idempotencyKey } },
			limit: 1,
			depth: 0,
			overrideAccess: false,
			req,
			user: req.user,
		})
	const existing = (await find()).docs[0]
	if (existing) return publicationSummary(existing as unknown as PublicationRecord)
	const commandReq = commandRequest(req)
	try {
		const doc = await req.payload.create({
			collection: "social-publications",
			req: commandReq,
			user: actor,
			overrideAccess: false,
			data: {
				account: input.accountId,
				sourcePost: input.postId,
				sourceLocale: input.locale,
				sourceUpdatedAt,
				sourceHash: hashSnapshot(source),
				snapshotHash,
				idempotencyKey,
				platform: source.platform,
				providerAccountId: source.providerAccountId,
				status: "prepared",
				snapshot: source,
				preparedPayload: prepared,
				attempts: [
					{
						actor: actor.id,
						entryPoint: req.payloadAPI === "MCP" ? "mcp" : "admin",
						action: "prepare",
						previousStatus: "preparing",
						nextStatus: "prepared",
						snapshotHash,
						occurredAt: new Date().toISOString(),
					},
				],
			},
		})
		return publicationSummary(doc as unknown as PublicationRecord)
	} catch (error) {
		const duplicate = (await find()).docs[0]
		if (duplicate) return publicationSummary(duplicate as unknown as PublicationRecord)
		throw error
	}
}

async function queueCommand(args: unknown, req: PayloadRequest, action: QueueAction) {
	const actor = requireOperator(req, action === "publish")
	const input = commandSchema.parse(args)
	const doc = await readPublication(input.publicationId, req)
	if (input.expectedSnapshotHash !== doc.snapshotHash)
		throw new SocialPublishingError("prepare", "SNAPSHOT_MISMATCH")
	verifySnapshot(doc)
	const account = await req.payload.findByID({
		collection: "social-accounts",
		id: relationshipID(doc.account),
		depth: 0,
		req,
		user: actor,
		overrideAccess: false,
	})
	if (
		!account.enabled ||
		account.platform !== doc.snapshot.platform ||
		account.providerAccountId !== doc.snapshot.providerAccountId
	)
		throw new SocialPublishingError("prepare", "ACCOUNT_DISABLED_OR_CHANGED")
	const adapter = getSocialPublisherAdapter(account.platform)
	adapter.validatePrepared(doc.preparedPayload)
	if (!canQueue(doc, action, adapter.capabilities.remoteDraft)) {
		if (
			recoveryAction(doc) === action &&
			["draft_creating", "publishing", "status_checking"].includes(doc.status)
		)
			await enqueueSocialPublication({
				publicationId: doc.id,
				action: doc.status === "status_checking" ? "status-check" : action,
			})
		if (doc.status === claimState(action)[0])
			await enqueueSocialPublication({ publicationId: doc.id, action })
		if (doc.status === "status_check_queued")
			await enqueueSocialPublication({ publicationId: doc.id, action: "status-check" })
		if (doc.status === "unknown" && doc.remote?.submissionId)
			await enqueueSocialPublication({ publicationId: doc.id, action: "status-check" })
		return publicationSummary(doc)
	}
	const { source } = await loadSource(
		{
			assets: doc.snapshot.assets,
			postId: relationshipID(doc.sourcePost),
			accountId: account.id,
			locale: prepareSchema.shape.locale.parse(doc.sourceLocale),
		},
		req
	)
	if (hashSnapshot(source) !== doc.sourceHash)
		throw new SocialPublishingError("prepare", "SOURCE_STALE")
	const occurredAt = new Date().toISOString()
	const entryPoint = req.payloadAPI === "MCP" ? "mcp" : "admin"
	const status = claimState(action)[0]
	const attempt = {
		actor: actor.id,
		entryPoint,
		action,
		previousStatus: doc.status,
		nextStatus: status,
		snapshotHash: doc.snapshotHash,
		occurredAt,
	} as const
	const queued = await transition(req, doc, {
		status,
		claimExpiresAt: null,
		lastError: null,
		attempts: [...(doc.attempts ?? []), attempt].slice(-50),
		...(action === "publish"
			? { approval: { actor: actor.id, entryPoint, snapshotHash: doc.snapshotHash, occurredAt } }
			: {}),
	})
	if (!queued) return publicationSummary(await readPublication(doc.id, req))
	await enqueueSocialPublication({ publicationId: doc.id, action })
	return publicationSummary(queued)
}

export const createSocialDraft = (args: unknown, req: PayloadRequest) =>
	queueCommand(args, req, "create-draft")
export const publishSocialPublication = (args: unknown, req: PayloadRequest) =>
	queueCommand(args, req, "publish")

export async function retrySocialDraftAfterRemoteInspection(args: unknown, req: PayloadRequest) {
	const actor = requireOperator(req)
	const input = inspectedDraftRetrySchema.parse(args)
	const doc = await readPublication(input.publicationId, req)
	if (input.expectedSnapshotHash !== doc.snapshotHash)
		throw new SocialPublishingError("prepare", "SNAPSHOT_MISMATCH")
	verifySnapshot(doc)
	if (!canRetryDraftAfterRemoteInspection(doc))
		throw new SocialPublishingError("create-draft", "REMOTE_INSPECTION_NOT_APPLICABLE")
	const account = await req.payload.findByID({
		collection: "social-accounts",
		id: relationshipID(doc.account),
		depth: 0,
		req,
		user: actor,
		overrideAccess: false,
	})
	if (
		!account.enabled ||
		account.platform !== doc.snapshot.platform ||
		account.providerAccountId !== doc.snapshot.providerAccountId
	)
		throw new SocialPublishingError("prepare", "ACCOUNT_DISABLED_OR_CHANGED")
	const { source } = await loadSource(
		{
			assets: doc.snapshot.assets,
			postId: relationshipID(doc.sourcePost),
			accountId: account.id,
			locale: prepareSchema.shape.locale.parse(doc.sourceLocale),
		},
		req
	)
	if (hashSnapshot(source) !== doc.sourceHash)
		throw new SocialPublishingError("prepare", "SOURCE_STALE")
	const occurredAt = new Date().toISOString()
	const entryPoint = req.payloadAPI === "MCP" ? "mcp" : "admin"
	const attempt = {
		actor: actor.id,
		entryPoint,
		action: "confirm-no-remote-draft-and-retry",
		previousStatus: doc.status,
		nextStatus: "draft_queued",
		snapshotHash: doc.snapshotHash,
		occurredAt,
	} as const
	const queued = await transition(req, doc, {
		status: "draft_queued",
		claimExpiresAt: null,
		lastError: null,
		attempts: [...(doc.attempts ?? []), attempt].slice(-50),
	})
	if (!queued) return publicationSummary(await readPublication(doc.id, req))
	await enqueueSocialPublication({ publicationId: doc.id, action: "create-draft" })
	return publicationSummary(queued)
}
