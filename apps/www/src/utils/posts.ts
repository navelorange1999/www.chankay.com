import { DEFAULT_LOCALE, formatLocalizedDate, getUiStrings, type SupportedLocale } from "@repo/i18n"
import type {
	MediaInterface,
	Post,
	SiteConfig,
	Tag,
} from "@repo/typescript-config/typings/payload-types"

import { resolveMedia, resolveSiteDescription } from "@/utils/seo"

function asOptionalString(value: unknown): string | undefined {
	return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined
}

export function formatPostDate(
	value?: string | null,
	locale: SupportedLocale = DEFAULT_LOCALE
): string | undefined {
	return formatLocalizedDate(value, locale)
}

export function resolvePostDisplayExcerpt(post: Pick<Post, "excerpt">): string | undefined {
	return asOptionalString(post.excerpt)
}

export function resolvePostSeoDescription(
	post: Pick<Post, "excerpt" | "meta">,
	siteConfig?: Pick<SiteConfig, "metaDescription" | "siteDescription"> | null
): string {
	return (
		asOptionalString(post.meta?.description) ||
		resolvePostDisplayExcerpt(post) ||
		resolveSiteDescription(siteConfig)
	)
}

export function resolvePostDisplayTitle(
	post: Pick<Post, "title">,
	locale: SupportedLocale = DEFAULT_LOCALE
): string {
	return asOptionalString(post.title) || getUiStrings(locale).untitledPost
}

export function resolvePostSeoTitle(
	post: Pick<Post, "title" | "meta">,
	locale: SupportedLocale = DEFAULT_LOCALE
): string {
	return asOptionalString(post.meta?.title) || resolvePostDisplayTitle(post, locale)
}

export function resolvePostImage(
	post: Pick<Post, "featuredImage" | "meta">
): MediaInterface | null {
	return resolveMedia(post.featuredImage) || resolveMedia(post.meta?.image)
}

export function resolvePostTags(post: Pick<Post, "tags" | "primaryTag">): Tag[] {
	const tags = new Map<string, Tag>()

	for (const item of post.tags || []) {
		if (item && typeof item === "object" && "id" in item && "name" in item) {
			tags.set(item.id, item as Tag)
		}
	}

	if (
		post.primaryTag &&
		typeof post.primaryTag === "object" &&
		"id" in post.primaryTag &&
		"name" in post.primaryTag
	) {
		tags.set(post.primaryTag.id, post.primaryTag as Tag)
	}

	return Array.from(tags.values())
}
