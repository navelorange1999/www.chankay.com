import type { Payload, Where } from "payload"

type Locale = "en" | "zh-CN"
type Selection = { category: string; topic: string; page: number }

export class TopicSelectionUnavailable extends Error {}

function relationId(value: unknown): string | null {
	if (typeof value === "string") return value
	if (value && typeof value === "object" && "id" in value) {
		const id = (value as { id: unknown }).id
		return typeof id === "string" ? id : null
	}
	return null
}

async function publicIds(
	payload: Payload,
	collection: "categories" | "tags"
): Promise<Set<string>> {
	const ids = new Set<string>()
	let page = 1
	let totalPages = 1
	while (page <= totalPages) {
		const result = await payload.find({
			collection,
			where: { _status: { equals: "published" } },
			draft: false,
			overrideAccess: false,
			depth: 0,
			joins: false,
			select: {},
			limit: 200,
			page,
			sort: "id",
		})
		for (const doc of result.docs) ids.add(String(doc.id))
		totalPages = result.totalPages
		page += 1
	}
	return ids
}

export async function getPublicTopicArticles(
	payload: Payload,
	locale: Locale,
	selection: Selection
) {
	const [categories, tags] = await Promise.all([
		publicIds(payload, "categories"),
		publicIds(payload, "tags"),
	])
	if (
		(selection.category !== "synthetic:uncategorized" && !categories.has(selection.category)) ||
		(selection.topic !== "synthetic:untagged" && !tags.has(selection.topic))
	) {
		throw new TopicSelectionUnavailable()
	}

	type Summary = {
		id: string
		slug: string
		title: string
		excerpt?: string
		publishedAt?: string
	}
	function toSummary(post: {
		id: string
		slug?: unknown
		title?: unknown
		excerpt?: unknown
		publishedAt?: unknown
	}): Summary | null {
		if (typeof post.slug !== "string" || typeof post.title !== "string") return null
		return {
			id: String(post.id),
			slug: post.slug,
			title: post.title,
			...(typeof post.excerpt === "string" ? { excerpt: post.excerpt } : {}),
			...(typeof post.publishedAt === "string" ? { publishedAt: post.publishedAt } : {}),
		}
	}
	const realCategory = selection.category !== "synthetic:uncategorized"
	const realTopic = selection.topic !== "synthetic:untagged"
	const clauses: Where[] = [{ _status: { equals: "published" } }]
	if (realCategory) clauses.push({ category: { equals: selection.category } })
	if (realTopic) clauses.push({ tags: { equals: selection.topic } })
	const where: Where = { and: clauses }
	const commonQuery = {
		collection: "posts" as const,
		where,
		draft: false,
		overrideAccess: false,
		depth: 0,
		locale,
		select: {
			slug: true as const,
			title: true as const,
			excerpt: true as const,
			publishedAt: true as const,
		},
		sort: ["-publishedAt", "id"],
	}
	const limit = 10
	if (realCategory && realTopic) {
		const result = await payload.find({ ...commonQuery, limit, page: selection.page })
		return {
			schemaVersion: 1 as const,
			locale,
			generatedAt: new Date().toISOString(),
			selection: { category: selection.category, topic: selection.topic },
			page: selection.page,
			limit,
			totalDocs: result.totalDocs,
			hasNextPage: result.hasNextPage,
			docs: result.docs.map(toSummary).filter((post): post is Summary => post !== null),
		}
	}
	const matches: Summary[] = []
	const seen = new Set<string>()
	let page = 1
	let totalPages = 1
	while (page <= totalPages) {
		const result = await payload.find({
			...commonQuery,
			select: { ...commonQuery.select, category: true, tags: true },
			limit: 200,
			page,
		})
		for (const post of result.docs) {
			const id = String(post.id)
			if (seen.has(id)) continue
			seen.add(id)
			const categoryId = relationId(post.category)
			const effectiveCategory =
				categoryId && categories.has(categoryId) ? categoryId : "synthetic:uncategorized"
			if (effectiveCategory !== selection.category) continue

			const validTags = new Set(
				(Array.isArray(post.tags) ? post.tags : [])
					.map(relationId)
					.filter((tagId): tagId is string => tagId !== null && tags.has(tagId))
			)
			const matchesTopic =
				selection.topic === "synthetic:untagged"
					? validTags.size === 0
					: validTags.has(selection.topic)
			if (!matchesTopic) continue
			const summary = toSummary(post)
			if (summary) matches.push(summary)
		}
		totalPages = result.totalPages
		page += 1
	}

	matches.sort(
		(a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? "") || a.id.localeCompare(b.id)
	)
	const start = (selection.page - 1) * limit
	return {
		schemaVersion: 1 as const,
		locale,
		generatedAt: new Date().toISOString(),
		selection: { category: selection.category, topic: selection.topic },
		page: selection.page,
		limit,
		totalDocs: matches.length,
		hasNextPage: start + limit < matches.length,
		docs: matches.slice(start, start + limit),
	}
}
