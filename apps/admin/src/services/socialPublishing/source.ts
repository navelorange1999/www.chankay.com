import { marked } from "marked"
import type { PayloadRequest } from "payload"
import { buildPostPreviewUrl } from "../../utils/postPreview"
import { getSocialPublisherAdapter } from "./adapters/registry"
import { settingsSchema, relationshipID, trustedMediaURL, prepareSchema } from "./validation"
import type { PublicationSourceSnapshot } from "./types"
import { SocialPublishingError } from "./types"
import type { z } from "zod"

export async function loadSource(input: z.infer<typeof prepareSchema>, req: PayloadRequest) {
	const read = { depth: 0, req, user: req.user, overrideAccess: false } as const
	const account = await req.payload.findByID({
		...read,
		collection: "social-accounts",
		id: input.accountId,
	})
	const post = await req.payload.findByID({
		...read,
		collection: "posts",
		id: input.postId,
		locale: input.locale,
		fallbackLocale: false,
		draft: false,
	})
	if (
		!account.enabled ||
		!account.allowedLocales.includes(input.locale) ||
		post.status !== "published" ||
		!post.title?.trim() ||
		!post.content?.trim() ||
		post.content.length > 100_000 ||
		!post.primaryTag
	)
		throw new SocialPublishingError("prepare", "SOURCE_POLICY")
	if (
		account.eligiblePrimaryTags?.length &&
		!account.eligiblePrimaryTags.map(relationshipID).includes(relationshipID(post.primaryTag))
	)
		throw new SocialPublishingError("prepare", "TAG_POLICY")
	const adapter = getSocialPublisherAdapter(account.platform)
	const media: PublicationSourceSnapshot["media"] = []
	async function addMedia(id: string) {
		const existing = media.find((entry) => entry.id === id)
		if (existing) return existing
		if (media.length >= 8) throw new SocialPublishingError("prepare", "MEDIA_LIMIT")
		const asset = await req.payload.findByID({ ...read, collection: "media", id })
		if (!asset.url || !["image/jpeg", "image/png"].includes(asset.mimeType ?? ""))
			throw new SocialPublishingError("prepare", "MEDIA_FORMAT")
		const entry = {
			id,
			url: trustedMediaURL(asset.url).href,
			mimeType: asset.mimeType!,
			updatedAt: asset.updatedAt,
		}
		media.push(entry)
		return entry
	}
	if (input.assets?.coverMediaId) await addMedia(input.assets.coverMediaId)
	else if (post.featuredImage) await addMedia(relationshipID(post.featuredImage))
	const urls: string[] = []
	marked.walkTokens(marked.lexer(post.content), (token) => {
		if (token.type === "image") urls.push(token.href)
	})
	for (const value of [...new Set(urls)]) {
		const url = trustedMediaURL(value)
		if (media.some((entry) => entry.url === url.href)) continue
		const filename = decodeURIComponent(url.pathname.split("/").at(-1) ?? "")
		if (!filename || filename.includes("/") || filename.includes("\\") || filename.length > 255)
			throw new SocialPublishingError("prepare", "MEDIA_REFERENCE")
		const matches = await req.payload.find({
			...read,
			collection: "media",
			where: { filename: { equals: filename } },
			limit: 2,
		})
		if (matches.docs.length !== 1) throw new SocialPublishingError("prepare", "MEDIA_REFERENCE")
		const asset = await addMedia(matches.docs[0]!.id)
		if (asset.url !== url.href) throw new SocialPublishingError("prepare", "MEDIA_REFERENCE")
	}
	if (!media.length) throw new SocialPublishingError("prepare", "COVER_REQUIRED")
	for (const diagram of input.assets?.diagramImages ?? []) await addMedia(diagram.mediaId)
	const site = new URL(process.env.WWW_SITE_URL || "https://www.chankay.com")
	if (site.protocol !== "https:" || site.username || site.password)
		throw new SocialPublishingError("prepare", "SITE_URL")
	const source: PublicationSourceSnapshot = {
		...(input.assets ? { assets: input.assets } : {}),
		accountId: account.id,
		platform: account.platform,
		providerAccountId: account.providerAccountId,
		postId: post.id,
		locale: input.locale,
		title: post.title,
		excerpt: post.excerpt ?? "",
		markdown: post.content,
		coverMediaId: media[0]!.id,
		media,
		canonicalUrl: buildPostPreviewUrl({
			locale: input.locale,
			siteUrl: site.href,
			slug: post.slug,
		}),
		adapterVersion: adapter.version,
		settings: settingsSchema.parse(account.platformSettings ?? {}),
	}
	return { source, sourceUpdatedAt: post.updatedAt, adapter }
}
