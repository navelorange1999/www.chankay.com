import { beforeEach, describe, expect, it, vi } from "vitest"
import type { PayloadRequest } from "payload"

vi.mock("../dispatcher", () => ({ enqueueSocialPublication: vi.fn() }))
vi.mock("../adapters/registry", () => ({
	getSocialPublisherAdapter: () => ({
		version: "wechat-v1",
		capabilities: { remoteDraft: "required", asyncPublishStatus: true },
		prepare: (source: { title: string }) => ({ title: source.title, warnings: [] }),
		validatePrepared: (value: unknown) => value,
	}),
}))

import { createSocialDraft, prepareSocialPublication, publishSocialPublication } from "../index"
import { enqueueSocialPublication } from "../dispatcher"
import { hashSnapshot } from "../snapshot"

const account = {
	id: "a",
	name: "Test account",
	platform: "wechat-official-account",
	providerAccountId: "destination",
	enabled: true,
	allowedLocales: ["zh-CN"],
	platformSettings: {},
}
const post = {
	id: "p",
	status: "published",
	title: "Chinese title",
	content: "Text",
	excerpt: "Summary",
	featuredImage: "m",
	primaryTag: "t",
	slug: "test",
	updatedAt: "2026-09-08T00:00:00Z",
}
let records: Record<string, unknown>[]
let req: PayloadRequest
beforeEach(() => {
	vi.clearAllMocks()
	records = []
	vi.stubEnv("NEXT_PUBLIC_SERVER_URL", "https://admin.example.com")
	vi.stubEnv("WWW_SITE_URL", "https://www.example.com")
	req = {
		context: {},
		user: { id: "u", collection: "users", role: "admin" },
		payload: {
			findByID: vi.fn(async ({ collection }: { collection: string }) =>
				collection === "posts"
					? post
					: collection === "social-accounts"
						? account
						: collection === "media"
							? {
									id: "m",
									url: "https://admin.example.com/api/media/file/cover.jpg",
									mimeType: "image/jpeg",
									updatedAt: post.updatedAt,
								}
							: records[0]
			),
			find: vi.fn(async () => ({ docs: records })),
			create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
				const doc = { ...data, id: "pub" }
				records.push(doc)
				return doc
			}),
			db: { updateOne: vi.fn() },
		},
	} as unknown as PayloadRequest
})

describe("shared commands", () => {
	it("redispatches queued work after a transport failure without recording a second approval", async () => {
		const prepared = await prepareSocialPublication(
			{ accountId: "a", postId: "p", locale: "zh-CN" },
			req
		)
		records[0] = { ...records[0], status: "draft_ready", remote: { draftId: "draft" } }
		vi.mocked(req.payload.db.updateOne).mockImplementation(async (args) => {
			records[0] = { ...records[0], ...args.data }
			return records[0] as never
		})
		vi.mocked(enqueueSocialPublication).mockRejectedValueOnce(new Error("Queue unavailable"))
		const input = { publicationId: "pub", expectedSnapshotHash: prepared.snapshotHash }
		await expect(publishSocialPublication(input, req)).rejects.toThrow("Queue unavailable")
		await publishSocialPublication(input, req)
		expect(req.payload.db.updateOne).toHaveBeenCalledTimes(1)
		expect(enqueueSocialPublication).toHaveBeenCalledTimes(2)
	})
	it("rejects an Editor's final confirmation before loading any publication", async () => {
		req.user = { id: "u", role: "editor", collection: "users" } as never
		await expect(
			publishSocialPublication({ publicationId: "pub", expectedSnapshotHash: "a".repeat(64) }, req)
		).rejects.toThrow()
		expect(req.payload.findByID).not.toHaveBeenCalled()
	})
	it("prepares once with explicit locale and user access", async () => {
		await prepareSocialPublication({ accountId: "a", postId: "p", locale: "zh-CN" }, req)
		await prepareSocialPublication({ accountId: "a", postId: "p", locale: "zh-CN" }, req)
		expect(records).toHaveLength(1)
		expect(req.payload.findByID).toHaveBeenCalledWith(
			expect.objectContaining({
				collection: "posts",
				locale: "zh-CN",
				fallbackLocale: false,
				overrideAccess: false,
				req,
				user: req.user,
			})
		)
		expect(req.payload.create).toHaveBeenCalledWith(
			expect.objectContaining({ overrideAccess: false, user: req.user })
		)
	})
	it("uses a publication-only cover and replays it when queuing a draft", async () => {
		const original = vi.mocked(req.payload.findByID).getMockImplementation()!
		vi.mocked(req.payload.findByID).mockImplementation(async (args) =>
			args.collection === "posts"
				? ({ ...post, featuredImage: null } as never)
				: (original(args) as never)
		)
		const prepared = await prepareSocialPublication(
			{ accountId: "a", postId: "p", locale: "zh-CN", assets: { coverMediaId: "override" } },
			req
		)
		expect(records[0]?.snapshot).toMatchObject({
			coverMediaId: "override",
			markdown: "Text",
			assets: { coverMediaId: "override" },
		})
		vi.mocked(req.payload.db.updateOne).mockImplementation(
			async (args) => ({ ...records[0], ...args.data }) as never
		)
		await createSocialDraft(
			{ publicationId: "pub", expectedSnapshotHash: prepared.snapshotHash },
			req
		)
		expect(enqueueSocialPublication).toHaveBeenCalledWith({
			publicationId: "pub",
			action: "create-draft",
		})
		expect(req.payload.findByID).toHaveBeenCalledWith(
			expect.objectContaining({ collection: "posts", draft: false })
		)
	})
	it("rejects changed publication assets before dispatching a draft", async () => {
		const prepared = await prepareSocialPublication(
			{ accountId: "a", postId: "p", locale: "zh-CN", assets: { coverMediaId: "override" } },
			req
		)
		const original = vi.mocked(req.payload.findByID).getMockImplementation()!
		vi.mocked(req.payload.findByID).mockImplementation(async (args) => {
			const doc = await original(args)
			return args.collection === "media"
				? ({ ...doc, updatedAt: "2026-09-09T00:00:00Z" } as never)
				: doc
		})
		await expect(
			createSocialDraft({ publicationId: "pub", expectedSnapshotHash: prepared.snapshotHash }, req)
		).rejects.toMatchObject({ code: "SOURCE_STALE" })
		expect(enqueueSocialPublication).not.toHaveBeenCalled()
	})
	it("rejects missing locale content", async () => {
		vi.mocked(req.payload.findByID).mockImplementation(
			async ({ collection }) =>
				(collection === "posts" ? { ...post, title: null } : account) as never
		)
		await expect(
			prepareSocialPublication({ accountId: "a", postId: "p", locale: "zh-CN" }, req)
		).rejects.toThrow()
		expect(req.payload.create).not.toHaveBeenCalled()
	})
	it("rejects hash mismatch before any transition", async () => {
		records.push({
			id: "pub",
			status: "draft_ready",
			account: "a",
			sourcePost: "p",
			sourceUpdatedAt: post.updatedAt,
			sourceLocale: "zh-CN",
			snapshotHash: hashSnapshot({}),
			snapshot: {},
			preparedPayload: {},
			remote: { draftId: "draft" },
		})
		await expect(
			publishSocialPublication({ publicationId: "pub", expectedSnapshotHash: "a".repeat(64) }, req)
		).rejects.toThrow()
		expect(req.payload.db.updateOne).not.toHaveBeenCalled()
	})
	it("rejects source changes after preparation before creating a remote draft", async () => {
		const prepared = await prepareSocialPublication(
			{ accountId: "a", postId: "p", locale: "zh-CN" },
			req
		)
		const original = vi.mocked(req.payload.findByID).getMockImplementation()!
		vi.mocked(req.payload.findByID).mockImplementation(async (args) =>
			args.collection === "posts"
				? ({ ...post, content: "Updated article" } as never)
				: (original(args) as never)
		)
		await expect(
			createSocialDraft({ publicationId: "pub", expectedSnapshotHash: prepared.snapshotHash }, req)
		).rejects.toThrow()
		expect(req.payload.db.updateOne).not.toHaveBeenCalled()
	})
	it("records approval in the same conditional update that queues publication", async () => {
		const prepared = await prepareSocialPublication(
			{ accountId: "a", postId: "p", locale: "zh-CN" },
			req
		)
		records[0] = { ...records[0], status: "draft_ready", remote: { draftId: "draft" } }
		vi.mocked(req.payload.db.updateOne).mockImplementation(
			async (args) => ({ ...records[0], ...args.data }) as never
		)
		await publishSocialPublication(
			{ publicationId: "pub", expectedSnapshotHash: prepared.snapshotHash },
			req
		)
		expect(req.payload.db.updateOne).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({
					status: "publish_queued",
					approval: expect.objectContaining({
						actor: "u",
						entryPoint: "admin",
						snapshotHash: prepared.snapshotHash,
					}),
				}),
			})
		)
		expect(enqueueSocialPublication).toHaveBeenCalledWith({
			publicationId: "pub",
			action: "publish",
		})
	})
})
