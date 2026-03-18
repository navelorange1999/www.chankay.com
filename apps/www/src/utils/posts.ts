import type {
	MediaInterface,
	Post,
	SiteConfig,
	Tag,
} from "@repo/typescript-config/typings/payload-types"

import { resolveMedia, resolveSiteDescription, resolveSiteUrl } from "@/utils/seo"

function asOptionalString(value: unknown): string | undefined {
	return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined
}

export function resolvePostPath(slug?: string | null): string {
	const value = asOptionalString(slug)
	if (!value) {
		return "/posts"
	}

	return `/posts/${value.replace(/^\/+|\/+$/g, "")}`
}

export function resolvePostAbsoluteUrl(
	siteConfig: SiteConfig | null | undefined,
	slug?: string | null
): string {
	return new URL(resolvePostPath(slug), `${resolveSiteUrl(siteConfig)}/`).toString()
}

export function formatPostDate(value?: string | null): string | undefined {
	const dateValue = asOptionalString(value)
	if (!dateValue) return undefined

	const date = new Date(dateValue)
	if (Number.isNaN(date.getTime())) return undefined

	return new Intl.DateTimeFormat("en", {
		day: "numeric",
		month: "short",
		year: "numeric",
	}).format(date)
}

export function resolvePostExcerpt(post: Pick<Post, "excerpt" | "meta">): string {
	return (
		asOptionalString(post.meta?.description) ||
		asOptionalString(post.excerpt) ||
		resolveSiteDescription(undefined)
	)
}

export function resolvePostTitle(post: Pick<Post, "title" | "meta">): string {
	return asOptionalString(post.meta?.title) || post.title
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
