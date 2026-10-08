import { isSafePostSlug, isSupportedLocale, type SupportedLocale } from "@repo/i18n"

import { resolvePayloadBaseUrl } from "@/utils/payloadClient"

export type TopicMapResponse = {
	schemaVersion: 2
	metric: "published-posts"
	locale: SupportedLocale
	generatedAt: string
	totals: {
		publishedPostCount: number
		areaValue: number
	}
	categories: Array<{
		id: string
		kind: "category" | "uncategorized"
		label: string
		colorToken?: "chart-1" | "chart-2" | "chart-3" | "chart-4" | "chart-5"
		publishedPostCount: number
		areaValue: number
		articles: Array<{
			id: string
			slug: string
			title: string
			value: 1
		}>
	}>
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value)
}

export function isTopicMapResponse(value: unknown): value is TopicMapResponse {
	if (!isRecord(value) || value.schemaVersion !== 2 || value.metric !== "published-posts")
		return false
	if (
		!isSupportedLocale(value.locale) ||
		typeof value.generatedAt !== "string" ||
		!Number.isFinite(Date.parse(value.generatedAt))
	)
		return false
	if (!isRecord(value.totals) || !Array.isArray(value.categories)) return false
	for (const key of ["publishedPostCount", "areaValue"]) {
		if (!Number.isSafeInteger(value.totals[key]) || (value.totals[key] as number) < 0) return false
	}
	const categoryIds = new Set<string>()
	const articleIds = new Set<string>()
	for (const category of value.categories) {
		if (
			!isRecord(category) ||
			typeof category.id !== "string" ||
			!category.id ||
			categoryIds.has(category.id) ||
			(category.kind !== "category" && category.kind !== "uncategorized") ||
			typeof category.label !== "string" ||
			!category.label ||
			!Array.isArray(category.articles) ||
			category.publishedPostCount !== category.articles.length ||
			category.areaValue !== category.articles.length ||
			(category.colorToken !== undefined &&
				!["chart-1", "chart-2", "chart-3", "chart-4", "chart-5"].includes(
					category.colorToken as string
				))
		)
			return false
		categoryIds.add(category.id)
		for (const article of category.articles) {
			if (
				!isRecord(article) ||
				typeof article.id !== "string" ||
				!article.id ||
				articleIds.has(article.id) ||
				typeof article.title !== "string" ||
				!article.title ||
				typeof article.slug !== "string" ||
				!isSafePostSlug(article.slug) ||
				article.value !== 1
			)
				return false
			articleIds.add(article.id)
		}
	}
	return (
		articleIds.size === value.totals.publishedPostCount &&
		articleIds.size === value.totals.areaValue
	)
}

export async function getTopicMap(locale: SupportedLocale): Promise<TopicMapResponse | null> {
	try {
		const url = new URL(`${resolvePayloadBaseUrl()}/posts/topic-map`)
		url.searchParams.set("locale", locale)
		const response = await fetch(url, { next: { revalidate: 60, tags: [`topic-map:${locale}`] } })
		if (!response.ok) return null
		const data: unknown = await response.json()
		return isTopicMapResponse(data) && data.locale === locale ? data : null
	} catch {
		return null
	}
}
