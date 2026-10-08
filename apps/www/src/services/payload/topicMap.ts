import type { SupportedLocale } from "@repo/i18n"

import { resolvePayloadBaseUrl } from "@/utils/payloadClient"

export type TopicMapResponse = {
	schemaVersion: 1
	metric: "tag-usages-with-untagged"
	locale: SupportedLocale
	generatedAt: string
	totals: {
		publishedPostCount: number
		tagAssignmentCount: number
		untaggedPostCount: number
		areaValue: number
	}
	categories: Array<{
		id: string
		kind: "category" | "uncategorized"
		label: string
		colorToken?: "chart-1" | "chart-2" | "chart-3" | "chart-4" | "chart-5"
		publishedPostCount: number
		areaValue: number
		topics: Array<{
			id: string
			tagId: string | null
			kind: "tag" | "untagged"
			label: string
			value: number
		}>
	}>
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value)
}

export function isTopicMapResponse(value: unknown): value is TopicMapResponse {
	if (!isRecord(value) || value.schemaVersion !== 1 || value.metric !== "tag-usages-with-untagged")
		return false
	if (typeof value.locale !== "string" || typeof value.generatedAt !== "string") return false
	if (!isRecord(value.totals) || !Array.isArray(value.categories)) return false
	for (const key of [
		"publishedPostCount",
		"tagAssignmentCount",
		"untaggedPostCount",
		"areaValue",
	]) {
		if (!Number.isSafeInteger(value.totals[key]) || (value.totals[key] as number) < 0) return false
	}
	let area = 0
	let posts = 0
	const ids = new Set<string>()
	for (const category of value.categories) {
		if (
			!isRecord(category) ||
			typeof category.id !== "string" ||
			!category.id ||
			(category.kind !== "category" && category.kind !== "uncategorized") ||
			typeof category.label !== "string" ||
			!category.label ||
			!Array.isArray(category.topics) ||
			!Number.isSafeInteger(category.publishedPostCount) ||
			(category.publishedPostCount as number) < 0 ||
			!Number.isSafeInteger(category.areaValue) ||
			(category.areaValue as number) < 0 ||
			(category.colorToken !== undefined &&
				!["chart-1", "chart-2", "chart-3", "chart-4", "chart-5"].includes(
					category.colorToken as string
				)) ||
			ids.has(category.id)
		)
			return false
		ids.add(category.id)
		let categoryArea = 0
		for (const topic of category.topics) {
			if (
				!isRecord(topic) ||
				typeof topic.id !== "string" ||
				!topic.id ||
				ids.has(topic.id) ||
				(topic.kind !== "tag" && topic.kind !== "untagged") ||
				typeof topic.label !== "string" ||
				!topic.label ||
				!(typeof topic.tagId === "string" || topic.tagId === null) ||
				(topic.kind === "tag" && !topic.tagId) ||
				(topic.kind === "untagged" && topic.tagId !== null) ||
				!Number.isSafeInteger(topic.value) ||
				(topic.value as number) <= 0
			)
				return false
			ids.add(topic.id)
			categoryArea += topic.value as number
		}
		if (categoryArea !== category.areaValue) return false
		area += categoryArea
		posts += category.publishedPostCount as number
	}
	return (
		area === value.totals.areaValue &&
		posts === value.totals.publishedPostCount &&
		(value.totals.tagAssignmentCount as number) + (value.totals.untaggedPostCount as number) ===
			area
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
