import { describe, expect, it, vi } from "vitest"
import { renderWeChat } from "../renderer"
import { createWeChatAdapter } from "../index"
import { WeChatClient } from "../client"
import { resolveSocialCredentials } from "../../../credentialProvider"
import type { AdapterExecutionContext, PublicationSourceSnapshot } from "../../../types"

const source: PublicationSourceSnapshot = {
	accountId: "account",
	platform: "wechat-official-account",
	providerAccountId: "provider",
	postId: "post",
	locale: "zh-CN",
	title: "A title",
	excerpt: "Summary",
	markdown: "# Heading\n\nSafe **content**.",
	coverMediaId: "cover",
	media: [
		{
			id: "cover",
			url: "https://www.chankay.com/cover.jpg",
			mimeType: "image/jpeg",
			updatedAt: "2026-09-08",
		},
	],
	canonicalUrl: "https://www.chankay.com/zh-CN/posts/example",
	adapterVersion: "wechat-v1",
	settings: { author: "Author", openComments: false, onlyFansCanComment: false },
}
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })
const unchangedDraft = async () => {
	const prepared = await renderWeChat(source)
	return reply({
		news_item: [
			{
				title: prepared.title,
				author: prepared.settings.author,
				digest: prepared.summary,
				content: prepared.html,
				content_source_url: prepared.canonicalUrl,
				thumb_media_id: "cover-remote",
				need_open_comment: 0,
				only_fans_can_comment: 0,
			},
		],
	})
}
const context = (): AdapterExecutionContext => ({
	credentials: { providerAccountId: "provider", appId: "provider", appSecret: "" },
	remote: {},
	loadMedia: vi
		.fn()
		.mockResolvedValue({ bytes: new Uint8Array([255, 216, 255]), mimeType: "image/jpeg" }),
	checkpoint: vi.fn().mockResolvedValue(undefined),
})

describe("WeChat renderer", () => {
	it("renders deterministic allowlisted HTML", async () => {
		const prepared = await renderWeChat(source)
		expect(prepared.html).toContain("<strong>content</strong>")
		expect(await renderWeChat(source)).toEqual(prepared)
	})
	it.each([
		"<script>alert(1)</script>",
		"<img src=x onerror=alert(1)>",
		"| A | B |\n|---|---|\n|1|2|",
		"[unsafe](javascript:alert(1))",
		"![image](https://untrusted.example/image.png)",
	])("rejects unsupported or unsafe content: %s", async (markdown) => {
		await expect(renderWeChat({ ...source, markdown })).rejects.toMatchObject({
			stage: "prepare",
			retryable: false,
		})
	})
	it("resolves inline images only from explicit Media references", async () => {
		const prepared = await renderWeChat({
			...source,
			markdown: "![Alt](https://www.chankay.com/cover.jpg)",
		})
		expect(prepared.images).toEqual([{ id: "cover", url: "https://www.chankay.com/cover.jpg" }])
	})
	it("rejects unavailable covers and changed adapter versions", async () => {
		await expect(renderWeChat({ ...source, media: [] })).rejects.toThrow()
		await expect(renderWeChat({ ...source, adapterVersion: "other" })).rejects.toThrow()
	})
})

describe("WeChat provider operations", () => {
	it("uploads cover, checkpoints, creates one draft and reuses its ID", async () => {
		const fetcher = vi
			.fn()
			.mockResolvedValueOnce(reply({ access_token: crypto.randomUUID(), expires_in: 7200 }))
			.mockResolvedValueOnce(reply({ media_id: "cover-remote" }))
			.mockResolvedValueOnce(reply({ media_id: "draft-remote" }))
		const adapter = createWeChatAdapter({ fetch: fetcher })
		const ctx = context()
		const prepared = await adapter.prepare(source)
		const result = await adapter.createDraft(prepared, ctx)
		expect(result.draftId).toBe("draft-remote")
		expect(ctx.checkpoint).toHaveBeenCalledWith(
			expect.objectContaining({ media: { cover: "cover-remote" } })
		)
		expect(await adapter.createDraft(prepared, { ...ctx, remote: result })).toEqual(result)
		expect(fetcher).toHaveBeenCalledTimes(3)
	})
	it("treats mutation transport failures as ambiguous without exposing provider details", async () => {
		const client = new WeChatClient({
			fetch: vi
				.fn()
				.mockResolvedValueOnce(reply({ access_token: crypto.randomUUID(), expires_in: 7200 }))
				.mockRejectedValueOnce(new Error("unsafe provider detail")),
		})
		await expect(
			client.request("/cgi-bin/draft/add", {}, context().credentials, "create-draft")
		).rejects.toMatchObject({
			message: "Social publishing provider request failed.",
			ambiguous: true,
			retryable: false,
		})
	})
	it("rejects malformed mutation responses as ambiguous", async () => {
		const adapter = createWeChatAdapter({
			fetch: vi
				.fn()
				.mockResolvedValueOnce(reply({ access_token: crypto.randomUUID(), expires_in: 7200 }))
				.mockResolvedValueOnce(await unchangedDraft())
				.mockResolvedValueOnce(reply({})),
		})
		await expect(
			adapter.publish(await adapter.prepare(source), {
				...context(),
				remote: { draftId: "draft", media: { cover: "cover-remote" } },
			})
		).rejects.toMatchObject({ ambiguous: true })
	})
	it("checks async status without calling a mutation endpoint", async () => {
		const fetcher = vi
			.fn()
			.mockResolvedValueOnce(reply({ access_token: crypto.randomUUID(), expires_in: 7200 }))
			.mockResolvedValueOnce(reply({ publish_status: 1 }))
			.mockResolvedValueOnce(
				reply({
					publish_status: 0,
					article_id: "article",
					article_detail: { item: [{ article_url: "https://mp.weixin.qq.com/s/example" }] },
				})
			)
		const adapter = createWeChatAdapter({ fetch: fetcher })
		const ctx = context()
		const remote = { submissionId: "submission" }
		expect(await adapter.getStatus(remote, ctx)).toMatchObject({ status: "pending" })
		expect(await adapter.getStatus(remote, ctx)).toMatchObject({
			status: "published",
			publicationId: "article",
			url: "https://mp.weixin.qq.com/s/example",
		})
		expect(
			fetcher.mock.calls
				.slice(1)
				.every(([url]) => new URL(url).pathname === "/cgi-bin/freepublish/get")
		).toBe(true)
	})
	it("refreshes an explicitly invalid token once and sanitizes a rate limit", async () => {
		const fetcher = vi
			.fn()
			.mockResolvedValueOnce(reply({ access_token: crypto.randomUUID(), expires_in: 7200 }))
			.mockResolvedValueOnce(reply({ errcode: 42001, errmsg: "unsafe" }))
			.mockResolvedValueOnce(reply({ access_token: crypto.randomUUID(), expires_in: 7200 }))
			.mockResolvedValueOnce(reply({ errcode: 45009, errmsg: "unsafe" }))
		const client = new WeChatClient({ fetch: fetcher })
		await expect(
			client.request("/cgi-bin/draft/add", {}, context().credentials, "create-draft")
		).rejects.toMatchObject({ code: "45009", retryable: true, ambiguous: false })
		expect(fetcher).toHaveBeenCalledTimes(4)
	})
	it("rejects unknown references and provider identity mismatches before HTTP", () => {
		expect(() => resolveSocialCredentials("unlisted", "provider", {})).toThrow()
		expect(() =>
			resolveSocialCredentials("wechat-primary", "different", {
				WECHAT_PRIMARY_APP_ID: "provider",
				WECHAT_PRIMARY_APP_SECRET: "",
			})
		).toThrow()
	})
})

describe("WeChat execution safeguards", () => {
	it("rejects corrupted HTML before any remote call", async () => {
		const fetcher = vi.fn()
		const adapter = createWeChatAdapter({ fetch: fetcher })
		const prepared = await adapter.prepare(source)
		await expect(
			adapter.createDraft({ ...prepared, html: '<p onclick="run()">Content</p>' }, context())
		).rejects.toThrow()
		expect(fetcher).not.toHaveBeenCalled()
	})
	it("uploads inline media and uses only the returned WeChat URL in the draft", async () => {
		const fetcher = vi
			.fn()
			.mockResolvedValueOnce(reply({ access_token: crypto.randomUUID(), expires_in: 7200 }))
			.mockResolvedValueOnce(reply({ media_id: "cover-remote" }))
			.mockResolvedValueOnce(reply({ url: "https://mmbiz.qpic.cn/image.jpg" }))
			.mockResolvedValueOnce(reply({ media_id: "draft" }))
		const adapter = createWeChatAdapter({ fetch: fetcher })
		const prepared = await adapter.prepare({
			...source,
			markdown: "![Image](https://www.chankay.com/cover.jpg)",
		})
		await adapter.createDraft(prepared, context())
		const sent = JSON.parse(fetcher.mock.calls[3]![1].body)
		expect(sent.articles[0].content).toContain('src="https://mmbiz.qpic.cn/image.jpg"')
		expect(sent.articles[0].content).not.toContain("www.chankay.com/cover.jpg")
	})
	it("persists the publish submission and prevents duplicate mutation", async () => {
		const fetcher = vi
			.fn()
			.mockResolvedValueOnce(reply({ access_token: crypto.randomUUID(), expires_in: 7200 }))
			.mockResolvedValueOnce(await unchangedDraft())
			.mockResolvedValueOnce(reply({ publish_id: "submission" }))
		const adapter = createWeChatAdapter({ fetch: fetcher })
		const ctx = { ...context(), remote: { draftId: "draft", media: { cover: "cover-remote" } } }
		const prepared = await adapter.prepare(source)
		const result = await adapter.publish(prepared, ctx)
		expect(ctx.checkpoint).toHaveBeenCalledWith({
			draftId: "draft",
			media: { cover: "cover-remote" },
			submissionId: "submission",
			status: "pending",
		})
		expect(await adapter.publish(prepared, { ...ctx, remote: result })).toEqual(result)
		expect(fetcher).toHaveBeenCalledTimes(3)
	})
	it("marks a failed checkpoint after accepted publication ambiguous", async () => {
		const fetcher = vi
			.fn()
			.mockResolvedValueOnce(reply({ access_token: crypto.randomUUID(), expires_in: 7200 }))
			.mockResolvedValueOnce(await unchangedDraft())
			.mockResolvedValueOnce(reply({ publish_id: "submission" }))
		const adapter = createWeChatAdapter({ fetch: fetcher })
		const ctx = {
			...context(),
			remote: { draftId: "draft", media: { cover: "cover-remote" } },
			checkpoint: vi.fn().mockRejectedValue(new Error("internal details")),
		}
		await expect(adapter.publish(await adapter.prepare(source), ctx)).rejects.toMatchObject({
			code: "CHECKPOINT",
			ambiguous: true,
			retryable: false,
		})
	})
	it("returns final provider rejection as failed status", async () => {
		const adapter = createWeChatAdapter({
			fetch: vi
				.fn()
				.mockResolvedValueOnce(reply({ access_token: crypto.randomUUID(), expires_in: 7200 }))
				.mockResolvedValueOnce(reply({ publish_status: 2 })),
		})
		expect(await adapter.getStatus({ submissionId: "submission" }, context())).toEqual({
			submissionId: "submission",
			status: "failed",
		})
	})
	it("refreshes cached tokens before expiry", async () => {
		let now = 0
		const fetcher = vi
			.fn()
			.mockResolvedValueOnce(reply({ access_token: crypto.randomUUID(), expires_in: 120 }))
			.mockResolvedValueOnce(reply({ publish_status: 1 }))
			.mockResolvedValueOnce(reply({ access_token: crypto.randomUUID(), expires_in: 120 }))
			.mockResolvedValueOnce(reply({ publish_status: 1 }))
		const adapter = createWeChatAdapter({ fetch: fetcher, now: () => now })
		await adapter.getStatus({ submissionId: "submission" }, context())
		now = 61000
		await adapter.getStatus({ submissionId: "submission" }, context())
		expect(
			fetcher.mock.calls.filter(([url]) => new URL(url).pathname === "/cgi-bin/stable_token")
		).toHaveLength(2)
	})
	it("never retries an ambiguous server error", async () => {
		const fetcher = vi
			.fn()
			.mockResolvedValueOnce(reply({ access_token: crypto.randomUUID(), expires_in: 7200 }))
			.mockResolvedValueOnce(await unchangedDraft())
			.mockResolvedValueOnce(reply({ errmsg: "unsafe" }, 500))
		const adapter = createWeChatAdapter({ fetch: fetcher })
		await expect(
			adapter.publish(await adapter.prepare(source), {
				...context(),
				remote: { draftId: "draft", media: { cover: "cover-remote" } },
			})
		).rejects.toMatchObject({ code: "HTTP_500", ambiguous: true, retryable: false })
		expect(fetcher).toHaveBeenCalledTimes(3)
	})
	it("rejects unknown success status codes without a mutation", async () => {
		const adapter = createWeChatAdapter({
			fetch: vi
				.fn()
				.mockResolvedValueOnce(reply({ access_token: crypto.randomUUID(), expires_in: 7200 }))
				.mockResolvedValueOnce(reply({ publish_status: 100 })),
		})
		await expect(
			adapter.getStatus({ submissionId: "submission" }, context())
		).rejects.toMatchObject({
			stage: "status-check",
			code: "MALFORMED_RESPONSE",
			retryable: true,
			ambiguous: false,
		})
	})
	it("rejects duplicate media identities in persisted prepared payloads", async () => {
		const adapter = createWeChatAdapter()
		const prepared = await adapter.prepare(source)
		expect(() =>
			adapter.validatePrepared({
				...prepared,
				images: [
					{ id: "same", url: "https://www.chankay.com/one.jpg" },
					{ id: "same", url: "https://www.chankay.com/two.jpg" },
				],
			})
		).toThrow()
	})
})

describe("WeChat publication budget and snapshot verification", () => {
	it("stops before sending HTTP when the execution deadline has elapsed", async () => {
		const fetcher = vi.fn()
		const adapter = createWeChatAdapter({ fetch: fetcher, now: () => 1000 })
		await expect(
			adapter.createDraft(await adapter.prepare(source), { ...context(), deadline: 1000 })
		).rejects.toMatchObject({ code: "BUDGET", ambiguous: false, retryable: true })
		expect(fetcher).not.toHaveBeenCalled()
	})
	it("rejects publication when the remote draft no longer matches the snapshot", async () => {
		const fetcher = vi
			.fn()
			.mockResolvedValueOnce(reply({ access_token: crypto.randomUUID(), expires_in: 7200 }))
			.mockResolvedValueOnce(reply({ news_item: [{ title: "Changed content" }] }))
		const adapter = createWeChatAdapter({ fetch: fetcher })
		await expect(
			adapter.publish(await adapter.prepare(source), {
				...context(),
				remote: { draftId: "draft", media: { cover: "cover-remote" } },
			})
		).rejects.toMatchObject({ code: "DRAFT_CHANGED", ambiguous: false, retryable: false })
		expect(
			fetcher.mock.calls.some(([url]) => new URL(url).pathname === "/cgi-bin/freepublish/submit")
		).toBe(false)
	})
})

describe("WeChat response bounds", () => {
	it("cancels an oversized provider response before reading the full body", async () => {
		const cancel = vi.fn()
		let chunks = 0
		const stream = new ReadableStream<Uint8Array>({
			pull(controller) {
				chunks++
				controller.enqueue(new Uint8Array(600000))
				if (chunks === 10) controller.close()
			},
			cancel,
		})
		const client = new WeChatClient({
			fetch: vi
				.fn()
				.mockResolvedValueOnce(reply({ access_token: crypto.randomUUID(), expires_in: 7200 }))
				.mockResolvedValueOnce(new Response(stream)),
		})
		await expect(
			client.request("/cgi-bin/draft/add", {}, context().credentials, "create-draft")
		).rejects.toMatchObject({ code: "MALFORMED_RESPONSE", ambiguous: true })
		expect(cancel).toHaveBeenCalled()
		expect(chunks).toBeLessThan(10)
	})
})
