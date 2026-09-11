import { WeChatClient, providerId, type WeChatClientOptions } from "./client"
import { createWeChatRelayFetch } from "./relayTransport"
import { prepareCoverUpload } from "./cover"
import {
	renderWeChat,
	validateWeChatPrepared,
	reconstructHtml,
	WECHAT_ADAPTER_VERSION,
	WECHAT_LIMITS,
} from "./renderer"
import {
	SocialPublishingError,
	type AdapterExecutionContext,
	type RemoteResult,
	type SocialPublisherAdapter,
} from "../../types"

function wechatUrl(value: unknown, host: string): string {
	if (typeof value !== "string" || value.length > 4096)
		throw new SocialPublishingError("media", "MALFORMED_RESPONSE", false, true)
	try {
		const url = new URL(value)
		if (
			!["https:", "http:"].includes(url.protocol) ||
			url.hostname !== host ||
			url.username ||
			url.password
		)
			throw new Error()
		return url.href
	} catch {
		throw new SocialPublishingError("media", "MALFORMED_RESPONSE", false, true)
	}
}
async function checkpoint(
	context: AdapterExecutionContext,
	remote: RemoteResult,
	stage: "media" | "create-draft" | "publish"
) {
	try {
		await context.checkpoint(remote)
	} catch {
		throw new SocialPublishingError(stage, "CHECKPOINT", false, true)
	}
}
export function createWeChatAdapter(
	options: WeChatClientOptions = {}
): SocialPublisherAdapter & Required<Pick<SocialPublisherAdapter, "createDraft" | "getStatus">> {
	const fetcher = options.fetch ?? createWeChatRelayFetch(process.env, fetch)
	const client = new WeChatClient({ ...options, fetch: fetcher })
	async function upload(
		id: string,
		inline: boolean,
		context: AdapterExecutionContext
	): Promise<string> {
		if (context.deadline !== undefined && context.deadline <= (options.now ?? Date.now)())
			throw new SocialPublishingError("media", "BUDGET", true)
		let asset: Awaited<ReturnType<AdapterExecutionContext["loadMedia"]>>
		try {
			asset = await context.loadMedia(id)
		} catch {
			throw new SocialPublishingError("media", "MEDIA_READ", true)
		}
		if (
			!["image/jpeg", "image/png"].includes(asset.mimeType) ||
			asset.bytes.byteLength === 0 ||
			asset.bytes.byteLength > (inline ? WECHAT_LIMITS.inlineImageBytes : WECHAT_LIMITS.coverBytes)
		)
			throw new SocialPublishingError("media", "VALIDATION")
		if (!inline) asset = await prepareCoverUpload(asset)
		const form = new FormData()
		form.append(
			"media",
			new Blob([new Uint8Array(asset.bytes)], { type: asset.mimeType }),
			asset.mimeType === "image/png" ? "image.png" : "image.jpg"
		)
		const data = await client.request(
			inline ? "/cgi-bin/media/uploadimg" : "/cgi-bin/material/add_material",
			form,
			context.credentials,
			"media",
			context.deadline
		)
		return inline ? wechatUrl(data.url, "mmbiz.qpic.cn") : providerId(data.media_id, "media")
	}
	return {
		platform: "wechat-official-account",
		version: WECHAT_ADAPTER_VERSION,
		capabilities: { remoteDraft: "required", asyncPublishStatus: true },
		prepare: renderWeChat,
		validatePrepared: validateWeChatPrepared,
		async createDraft(value, context) {
			const prepared = validateWeChatPrepared(value)
			if (context.remote.draftId) return context.remote
			const remote: RemoteResult = { ...context.remote, media: { ...context.remote.media } }
			const media = remote.media!
			if (!media.cover) {
				media.cover = await upload(prepared.coverMediaId, false, context)
				await checkpoint(context, remote, "media")
			}
			const replacements: Record<string, string> = {}
			for (const image of prepared.images) {
				const key = `inline:${image.id}`
				if (!media[key]) {
					media[key] = await upload(image.id, true, context)
					await checkpoint(context, remote, "media")
				}
				replacements[image.id] = wechatUrl(media[key], "mmbiz.qpic.cn")
			}
			const data = await client.request(
				"/cgi-bin/draft/add",
				{
					articles: [
						{
							article_type: "news",
							title: prepared.title,
							author: prepared.settings.author,
							digest: prepared.summary,
							content: reconstructHtml(prepared.html, prepared.images, replacements),
							content_source_url: prepared.canonicalUrl,
							thumb_media_id: providerId(media.cover, "media"),
							need_open_comment: prepared.settings.openComments ? 1 : 0,
							only_fans_can_comment: prepared.settings.onlyFansCanComment ? 1 : 0,
						},
					],
				},
				context.credentials,
				"create-draft",
				context.deadline
			)
			remote.draftId = providerId(data.media_id, "create-draft")
			await checkpoint(context, remote, "create-draft")
			return remote
		},
		async publish(value, context) {
			const prepared = validateWeChatPrepared(value)
			if (context.remote.submissionId || context.remote.publicationId) return context.remote
			if (!context.remote.draftId) throw new SocialPublishingError("publish", "VALIDATION")

			const expectedMedia = context.remote.media
			if (!expectedMedia?.cover) throw new SocialPublishingError("publish", "DRAFT_CHANGED")
			const replacements: Record<string, string> = {}
			for (const image of prepared.images) {
				const value = expectedMedia[`inline:${image.id}`]
				if (!value) throw new SocialPublishingError("publish", "DRAFT_CHANGED")
				replacements[image.id] = wechatUrl(value, "mmbiz.qpic.cn")
			}
			const draft = await client.request(
				"/cgi-bin/draft/get",
				{ media_id: providerId(context.remote.draftId, "publish") },
				context.credentials,
				"publish",
				context.deadline
			)
			const items = draft.news_item
			const article = Array.isArray(items) && items.length === 1 ? items[0] : undefined
			const expected = {
				title: prepared.title,
				author: prepared.settings.author,
				digest: prepared.summary,
				content: reconstructHtml(prepared.html, prepared.images, replacements),
				content_source_url: prepared.canonicalUrl,
				thumb_media_id: expectedMedia.cover,
				need_open_comment: prepared.settings.openComments ? 1 : 0,
				only_fans_can_comment: prepared.settings.onlyFansCanComment ? 1 : 0,
			}
			if (
				!article ||
				typeof article !== "object" ||
				Object.entries(expected).some(([key, value]) => article[key] !== value)
			)
				throw new SocialPublishingError("publish", "DRAFT_CHANGED")
			const data = await client.request(
				"/cgi-bin/freepublish/submit",
				{ media_id: providerId(context.remote.draftId, "publish") },
				context.credentials,
				"publish",
				context.deadline
			)
			const remote: RemoteResult = {
				...context.remote,
				submissionId: providerId(data.publish_id, "publish"),
				status: "pending",
			}
			await checkpoint(context, remote, "publish")
			return remote
		},
		async getStatus(remote, context) {
			if (remote.publicationId && remote.status === "published") return remote
			if (!remote.submissionId) throw new SocialPublishingError("status-check", "VALIDATION")
			const data = await client.request(
				"/cgi-bin/freepublish/get",
				{ publish_id: providerId(remote.submissionId, "status-check") },
				context.credentials,
				"status-check",
				context.deadline
			)
			if (data.publish_status === 1) return { ...remote, status: "pending" }
			if (data.publish_status === 0) {
				const publicationId = providerId(data.article_id, "status-check")
				const detail = data.article_detail as
					| { item?: Array<{ article_url?: unknown }> }
					| undefined
				let url: string | undefined
				if (detail?.item?.[0]?.article_url !== undefined) {
					try {
						url = wechatUrl(detail.item[0].article_url, "mp.weixin.qq.com")
					} catch {
						throw new SocialPublishingError("status-check", "MALFORMED_RESPONSE", true)
					}
				}
				return { ...remote, publicationId, ...(url ? { url } : {}), status: "published" }
			}
			if (typeof data.publish_status === "number" && [2, 3, 4, 5, 6].includes(data.publish_status))
				return { ...remote, status: "failed" }
			throw new SocialPublishingError("status-check", "MALFORMED_RESPONSE", true)
		},
	}
}
