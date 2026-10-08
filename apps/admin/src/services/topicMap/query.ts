import type { Payload } from "payload"

import { aggregateTopicMap, type ChartTone, type TopicMapResponse } from "./aggregate"

const PAGE_SIZE = 200
const PUBLISHED = { _status: { equals: "published" } } as const

function relationId(value: unknown): string | null {
	if (typeof value === "string") return value
	if (value && typeof value === "object" && "id" in value) {
		const id = (value as { id: unknown }).id
		return typeof id === "string" ? id : null
	}
	return null
}

function localizedLabel(value: unknown): string {
	return typeof value === "string" ? value : ""
}

async function readAllPublished<T>(
	payload: Payload,
	collection: "posts" | "categories",
	locale: "en" | "zh-CN",
	select: Record<string, true>
): Promise<T[]> {
	const docs: T[] = []
	let page = 1
	let totalPages = 1

	while (page <= totalPages) {
		const options = {
			where: PUBLISHED,
			draft: false as const,
			overrideAccess: false as const,
			depth: 0,
			locale,
			select,
			limit: PAGE_SIZE,
			page,
			sort: "id",
		}
		const result =
			collection === "posts"
				? await payload.find({ ...options, collection })
				: await payload.find({ ...options, collection, joins: false })
		docs.push(...(result.docs as T[]))
		totalPages = result.totalPages
		page += 1
	}

	return docs
}

export async function getPublicTopicMap(
	payload: Payload,
	locale: "en" | "zh-CN",
	labels: { uncategorized: string }
): Promise<TopicMapResponse> {
	const [posts, categories] = await Promise.all([
		readAllPublished<{ id: string; category?: unknown; title?: unknown; slug?: unknown }>(
			payload,
			"posts",
			locale,
			{
				category: true,
				title: true,
				slug: true,
			}
		),
		readAllPublished<{
			id: string
			name?: unknown
			sortOrder?: number | null
			colorToken?: string | null
		}>(payload, "categories", locale, {
			name: true,
			sortOrder: true,
			colorToken: true,
		}),
	])

	return aggregateTopicMap({
		locale,
		labels,
		posts: posts.map((post) => ({
			id: post.id,
			category: relationId(post.category),
			title: localizedLabel(post.title),
			slug: localizedLabel(post.slug),
		})),
		categories: categories.map((category) => ({
			id: category.id,
			label: localizedLabel(category.name),
			sortOrder: category.sortOrder,
			colorToken: /^chart-[1-5]$/.test(category.colorToken ?? "")
				? (category.colorToken as ChartTone)
				: null,
		})),
	})
}
