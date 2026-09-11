import type { PayloadRequest } from "payload"
import { getSocialPublisherAdapter } from "./adapters/registry"
import { resolveSocialCredentials } from "./credentialProvider"
import { enqueueSocialPublication } from "./dispatcher"
import { readPublication, transition, verifySnapshot } from "./records"
import { claimState } from "./state"
import { queueSchema, relationshipID, trustedMediaURL } from "./validation"
import {
	safeError,
	SocialPublishingError,
	type AdapterExecutionContext,
	type RemoteResult,
} from "./types"

async function runtimeRequest() {
	const [{ getPayload, createLocalReq }, { default: config }] = await Promise.all([
		import("payload"),
		import("@payload-config"),
	])
	const payload = await getPayload({ config })
	return createLocalReq({}, payload)
}

export async function processSocialPublication(input: unknown, suppliedRequest?: PayloadRequest) {
	const message = queueSchema.parse(input)
	const req = suppliedRequest ?? (await runtimeRequest())
	let doc = await readPublication(message.publicationId, req, true)
	const [queuedState, activeState] = claimState(message.action)
	if (
		doc.status === "unknown" &&
		doc.remote?.submissionId &&
		message.action === "status-check" &&
		(doc.statusChecks ?? 0) < 10
	) {
		const reconciled = await transition(req, doc, {
			status: "status_check_queued",
			claimExpiresAt: null,
		})
		if (!reconciled) return
		doc = reconciled
	}
	if (doc.status === activeState && doc.claimExpiresAt) {
		if (Date.parse(doc.claimExpiresAt) > Date.now())
			throw new Error("Social publication is still claimed.")
		// A crashed worker may have completed its last external mutation.
		const interrupted = await transition(req, doc, {
			status: "unknown",
			claimExpiresAt: null,
			lastError: safeError(
				new SocialPublishingError(message.action, "WORKER_INTERRUPTED", false, true),
				message.action
			),
		})
		if (interrupted?.remote?.submissionId)
			await enqueueSocialPublication({ publicationId: doc.id, action: "status-check" })
		return
	}
	if (doc.status !== queuedState) {
		if (doc.status === "status_check_queued" && message.action === "publish")
			await enqueueSocialPublication({ publicationId: doc.id, action: "status-check" })
		return
	}
	if (
		message.action === "status-check" &&
		doc.nextCheckAt &&
		Date.parse(doc.nextCheckAt) > Date.now()
	) {
		await enqueueSocialPublication(
			message,
			Math.ceil((Date.parse(doc.nextCheckAt) - Date.now()) / 1000)
		)
		return
	}
	const claimed = await transition(req, doc, {
		status: activeState,
		claimExpiresAt: new Date(Date.now() + 210_000).toISOString(),
	})
	if (!claimed) return
	doc = claimed
	async function save(data: Parameters<typeof transition>[2]) {
		const saved = await transition(req, doc, data)
		if (!saved) throw new SocialPublishingError(message.action, "CLAIM_LOST", false, true)
		doc = saved
	}
	let scheduleStatus = false
	try {
		verifySnapshot(doc)
		const account = await req.payload.findByID({
			collection: "social-accounts",
			id: relationshipID(doc.account),
			depth: 0,
			req,
			overrideAccess: true,
		})
		if (
			!account.enabled ||
			account.platform !== doc.snapshot.platform ||
			account.providerAccountId !== doc.snapshot.providerAccountId
		)
			throw new SocialPublishingError(message.action, "ACCOUNT_DISABLED_OR_CHANGED")
		const adapter = getSocialPublisherAdapter(account.platform)
		if (adapter.version !== doc.snapshot.adapterVersion)
			throw new SocialPublishingError(message.action, "ADAPTER_VERSION")
		const prepared = adapter.validatePrepared(doc.preparedPayload)
		const credentials = resolveSocialCredentials(
			account.credentialReference,
			doc.snapshot.providerAccountId
		)
		if (
			message.action === "publish" &&
			(!doc.approval || doc.approval.snapshotHash !== doc.snapshotHash)
		)
			throw new SocialPublishingError("publish", "APPROVAL_REQUIRED")
		const context: AdapterExecutionContext = {
			credentials,
			remote: doc.remote ?? {},
			deadline: Date.now() + 150_000,
			checkpoint: async (remote: RemoteResult) => {
				await save({ remote })
			},
			loadMedia: async (id) => {
				const snapshotted = doc.snapshot.media.find((asset) => asset.id === id)
				if (!snapshotted) throw new SocialPublishingError("media", "MEDIA_REFERENCE")
				const asset = await req.payload.findByID({
					collection: "media",
					id,
					depth: 0,
					req,
					overrideAccess: true,
				})
				if (
					asset.updatedAt !== snapshotted.updatedAt ||
					asset.url !== snapshotted.url ||
					asset.mimeType !== snapshotted.mimeType
				)
					throw new SocialPublishingError("media", "MEDIA_CHANGED")
				const response = await fetch(trustedMediaURL(snapshotted.url), {
					redirect: "error",
					signal: AbortSignal.timeout(8_000),
				})
				if (
					!response.ok ||
					!response.body ||
					!response.headers.get("content-type")?.split(";")[0]?.includes(snapshotted.mimeType)
				)
					throw new SocialPublishingError("media", "MEDIA_READ", true)
				const chunks: Uint8Array[] = []
				let size = 0
				const reader = response.body.getReader()
				try {
					while (true) {
						const { done, value } = await reader.read()
						if (done) break
						size += value.length
						if (size > 10_000_000) {
							await reader.cancel()
							throw new SocialPublishingError("media", "MEDIA_SIZE")
						}
						chunks.push(value)
					}
				} finally {
					reader.releaseLock()
				}
				return { bytes: Buffer.concat(chunks), mimeType: snapshotted.mimeType }
			},
		}
		if (message.action === "create-draft") {
			if (adapter.capabilities.remoteDraft === "unsupported" || !adapter.createDraft)
				throw new SocialPublishingError("create-draft", "UNSUPPORTED_ACTION")
			const remote = doc.remote?.draftId ? doc.remote : await adapter.createDraft(prepared, context)
			await save({ remote, status: "draft_ready", claimExpiresAt: null, lastError: null })
		} else {
			if (
				message.action === "status-check" &&
				(!adapter.capabilities.asyncPublishStatus || !adapter.getStatus)
			)
				throw new SocialPublishingError("status-check", "UNSUPPORTED_ACTION")
			const remote =
				message.action === "publish"
					? doc.remote?.submissionId || doc.remote?.publicationId
						? doc.remote
						: await adapter.publish(prepared, context)
					: await adapter.getStatus!(doc.remote ?? {}, context)
			if (remote.status === "pending" && !adapter.capabilities.asyncPublishStatus)
				throw new SocialPublishingError(message.action, "UNSUPPORTED_STATUS", false, true)
			const statusChecks = (doc.statusChecks ?? 0) + (message.action === "status-check" ? 1 : 0)
			if (remote.status === "published")
				await save({
					remote,
					status: "published",
					publishedAt: new Date().toISOString(),
					claimExpiresAt: null,
					lastError: null,
				})
			else if (remote.status === "failed")
				await save({
					remote,
					status: "failed",
					claimExpiresAt: null,
					lastError: safeError(
						new SocialPublishingError("status-check", "REMOTE_REJECTED"),
						"status-check"
					),
				})
			else if (statusChecks >= 10)
				await save({
					remote,
					statusChecks,
					status: "unknown",
					claimExpiresAt: null,
					lastError: safeError(
						new SocialPublishingError("status-check", "STATUS_EXHAUSTED", false, true),
						"status-check"
					),
				})
			else {
				await save({
					remote,
					status: "status_check_queued",
					claimExpiresAt: null,
					statusChecks,
					nextCheckAt: new Date(Date.now() + statusDelay(statusChecks) * 1000).toISOString(),
				})
				scheduleStatus = true
			}
		}
	} catch (error) {
		const lastError = safeError(error, message.action)
		if (message.action === "publish" && lastError.stage === "token") lastError.stage = "publish"
		const statusChecks = (doc.statusChecks ?? 0) + (message.action === "status-check" ? 1 : 0)
		await save({
			status: lastError.ambiguous || message.action === "status-check" ? "unknown" : "failed",
			lastError,
			statusChecks,
			claimExpiresAt: null,
		})
		if (
			doc.remote?.submissionId &&
			statusChecks < 10 &&
			(lastError.retryable || lastError.ambiguous)
		)
			scheduleStatus = true
	}
	// If dispatch fails after persistence, queue redelivery sees queued state and
	// safely retries only the read-only status operation.
	if (scheduleStatus)
		await enqueueSocialPublication(
			{ action: "status-check", publicationId: doc.id },
			statusDelay(doc.statusChecks ?? 0)
		)
}

function statusDelay(count: number) {
	return Math.min(300, 15 * 2 ** count)
}
