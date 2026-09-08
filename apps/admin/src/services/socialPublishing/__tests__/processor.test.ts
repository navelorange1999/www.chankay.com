import { beforeEach, describe, expect, it, vi } from "vitest"
import type { PayloadRequest } from "payload"
vi.mock("../credentialProvider", () => ({ resolveSocialCredentials: vi.fn() }))
vi.mock("../adapters/registry", () => ({ getSocialPublisherAdapter: vi.fn() }))
vi.mock("../dispatcher", () => ({ enqueueSocialPublication: vi.fn() }))
import { processSocialPublication } from "../processor"
import { getSocialPublisherAdapter } from "../adapters/registry"
import { enqueueSocialPublication } from "../dispatcher"
import { SocialPublishingError, type SocialPublisherAdapter } from "../types"
import { hashSnapshot } from "../snapshot"
import { canQueue } from "../state"
import type { PublicationRecord } from "../records"

beforeEach(() => vi.clearAllMocks())

function runtime(status: PublicationRecord["status"] = "publish_queued") {
	const snapshot = {
		platform: "wechat-official-account",
		providerAccountId: "destination",
		adapterVersion: "wechat-v1",
		media: [],
	}
	const preparedPayload = { title: "Article" }
	const snapshotHash = hashSnapshot({ source: snapshot, prepared: preparedPayload })
	let doc = {
		id: "p",
		account: "a",
		status,
		snapshot,
		preparedPayload,
		snapshotHash,
		remote: { draftId: "draft" },
		approval: { actor: "u", snapshotHash },
		attempts: [
			{
				actor: "u",
				entryPoint: "admin",
				action: "publish",
				previousStatus: "draft_ready",
				nextStatus: "publish_queued",
				snapshotHash,
				occurredAt: new Date().toISOString(),
			},
		],
	} as unknown as PublicationRecord
	const adapter = {
		version: "wechat-v1",
		capabilities: { remoteDraft: "required", asyncPublishStatus: true },
		validatePrepared: (v: unknown) => v,
		publish: vi.fn(async () => ({
			draftId: "draft",
			submissionId: "submission",
			status: "pending",
		})),
		createDraft: vi.fn(),
		getStatus: vi.fn(async () => ({
			submissionId: "submission",
			publicationId: "published",
			status: "published",
		})),
	}
	vi.mocked(getSocialPublisherAdapter).mockReturnValue(adapter as unknown as SocialPublisherAdapter)
	const req = {
		context: {},
		payload: {
			findByID: vi.fn(async ({ collection }: { collection: string }) =>
				collection === "social-publications"
					? structuredClone(doc)
					: {
							id: "a",
							enabled: true,
							platform: snapshot.platform,
							providerAccountId: "destination",
							credentialReference: "wechat-primary",
						}
			),
			db: {
				updateOne: vi.fn(
					async ({
						where,
						data,
					}: {
						where: { and: Array<Record<string, { equals: unknown }>> }
						data: Partial<PublicationRecord>
					}) => {
						if (
							!where.and.every((clause) =>
								Object.entries(clause).every(
									([key, value]) => doc[key as keyof PublicationRecord] === value.equals
								)
							)
						)
							return null
						doc = { ...doc, ...data }
						return structuredClone(doc)
					}
				),
			},
		},
	} as unknown as PayloadRequest
	return {
		req,
		adapter,
		read: () => doc,
		patch: (data: Partial<PublicationRecord>) => {
			doc = { ...doc, ...data }
		},
	}
}

describe("queue claims", () => {
	it("rejects a corrupted snapshot before contacting the provider", async () => {
		const { req, adapter, patch, read } = runtime()
		patch({ snapshotHash: "corrupted" })
		await processSocialPublication({ publicationId: "p", action: "publish" }, req)
		expect(adapter.publish).not.toHaveBeenCalled()
		expect(read().lastError?.code).toBe("SNAPSHOT_CORRUPT")
	})
	it("stops disabled destinations before provider execution", async () => {
		const { req, adapter, read } = runtime()
		const original = vi.mocked(req.payload.findByID).getMockImplementation()!
		vi.mocked(req.payload.findByID).mockImplementation(async (args) =>
			args.collection === "social-accounts"
				? ({ enabled: false } as never)
				: (original(args) as never)
		)
		await processSocialPublication({ publicationId: "p", action: "publish" }, req)
		expect(adapter.publish).not.toHaveBeenCalled()
		expect(read().lastError?.code).toBe("ACCOUNT_DISABLED_OR_CHANGED")
	})
	it("never calls provider when another worker won the atomic claim", async () => {
		const updateOne = vi.fn().mockResolvedValue(null)
		const req = {
			payload: {
				findByID: vi
					.fn()
					.mockResolvedValue({ id: "p", status: "publish_queued", snapshotHash: "hash" }),
				db: { updateOne },
			},
		} as unknown as PayloadRequest
		await processSocialPublication({ publicationId: "p", action: "publish" }, req)
		expect(updateOne).toHaveBeenCalledWith(
			expect.objectContaining({
				where: {
					and: expect.arrayContaining([
						{ id: { equals: "p" } },
						{ status: { equals: "publish_queued" } },
					]),
				},
			})
		)
		expect(getSocialPublisherAdapter).not.toHaveBeenCalled()
	})
	it("ignores repeated delivery after publication", async () => {
		const updateOne = vi.fn()
		const req = {
			payload: {
				findByID: vi.fn().mockResolvedValue({ id: "p", status: "published" }),
				db: { updateOne },
			},
		} as unknown as PayloadRequest
		await processSocialPublication({ publicationId: "p", action: "publish" }, req)
		expect(updateOne).not.toHaveBeenCalled()
	})
	it("claims concurrent deliveries once and schedules only read-only status work", async () => {
		const { req, adapter, read } = runtime()
		await Promise.all([
			processSocialPublication({ publicationId: "p", action: "publish" }, req),
			processSocialPublication({ publicationId: "p", action: "publish" }, req),
		])
		expect(adapter.publish).toHaveBeenCalledTimes(1)
		expect(read().status).toBe("status_check_queued")
		expect(enqueueSocialPublication).toHaveBeenCalledWith(
			{ publicationId: "p", action: "status-check" },
			15
		)
	})
	it("keeps transient publish token failures retryable and preserves their audit outcome", async () => {
		const { req, adapter, read } = runtime()
		adapter.publish.mockRejectedValue(new SocialPublishingError("token", "TRANSPORT", true))
		await processSocialPublication({ publicationId: "p", action: "publish" }, req)
		expect(read().status).toBe("failed")
		expect(canQueue(read(), "publish")).toBe(true)
		expect(read().attempts?.at(-1)?.error?.code).toBe("TRANSPORT")
	})
	it("reconciles a checkpointed submission after a worker crash without submitting again", async () => {
		const { req, adapter, patch, read } = runtime("publishing")
		patch({ remote: { submissionId: "submission" }, claimExpiresAt: "2026-01-01T00:00:00Z" })
		await processSocialPublication({ publicationId: "p", action: "publish" }, req)
		expect(read().status).toBe("unknown")
		await processSocialPublication({ publicationId: "p", action: "status-check" }, req)
		expect(adapter.publish).not.toHaveBeenCalled()
		expect(adapter.getStatus).toHaveBeenCalledTimes(1)
		expect(read().status).toBe("published")
	})
	it("stops ambiguous mutations without a known submission", async () => {
		const { req, adapter, read } = runtime()
		adapter.publish.mockRejectedValue(
			new SocialPublishingError("publish", "TRANSPORT", false, true)
		)
		await processSocialPublication({ publicationId: "p", action: "publish" }, req)
		expect(read().status).toBe("unknown")
		expect(canQueue(read(), "publish")).toBe(false)
		expect(enqueueSocialPublication).not.toHaveBeenCalled()
	})
	it("bounds status retries even when every lookup fails", async () => {
		const { req, adapter, patch, read } = runtime("status_check_queued")
		patch({ remote: { submissionId: "submission" }, statusChecks: 9 })
		adapter.getStatus.mockRejectedValue(
			new SocialPublishingError("status-check", "TRANSPORT", true)
		)
		await processSocialPublication({ publicationId: "p", action: "status-check" }, req)
		expect(read().statusChecks).toBe(10)
		expect(read().status).toBe("unknown")
		expect(enqueueSocialPublication).not.toHaveBeenCalled()
	})
	it("persists exhaustion after the tenth pending response and ignores later deliveries", async () => {
		const { req, adapter, patch, read } = runtime("status_check_queued")
		patch({ remote: { submissionId: "submission" }, statusChecks: 9 })
		adapter.getStatus.mockResolvedValue({ submissionId: "submission", status: "pending" } as never)
		await processSocialPublication({ publicationId: "p", action: "status-check" }, req)
		expect(read().statusChecks).toBe(10)
		await processSocialPublication({ publicationId: "p", action: "status-check" }, req)
		expect(adapter.getStatus).toHaveBeenCalledTimes(1)
	})
})
