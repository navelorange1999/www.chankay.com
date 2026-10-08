export type ChartTone = "chart-1" | "chart-2" | "chart-3" | "chart-4" | "chart-5"

export type TopicMapPost = {
	id: string
	category: string | null
	tags: readonly string[]
}

export type TopicMapCategory = {
	id: string
	label: string
	sortOrder?: number | null
	colorToken?: ChartTone | null
}

export type TopicMapTag = { id: string; label: string }

export type TopicMapResponse = {
	schemaVersion: 1
	metric: "tag-usages-with-untagged"
	locale: string
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
		colorToken?: ChartTone
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

type AggregateInput = {
	posts: readonly TopicMapPost[]
	categories: readonly TopicMapCategory[]
	tags: readonly TopicMapTag[]
	locale: string
	labels: { uncategorized: string; untagged: string }
	generatedAt?: string
}

type CategoryAccumulator = TopicMapResponse["categories"][number] & {
	topicCounts: Map<string, number>
}

const UNCATEGORIZED_ID = "synthetic:uncategorized"
const UNTAGGED_ID = "synthetic:untagged"

export function aggregateTopicMap(input: AggregateInput): TopicMapResponse {
	const categoryById = new Map(input.categories.map((category) => [category.id, category]))
	const tagById = new Map(input.tags.map((tag) => [tag.id, tag]))
	const categoryCounts = new Map<string, CategoryAccumulator>()
	const seenPostIds = new Set<string>()
	let tagAssignmentCount = 0
	let untaggedPostCount = 0

	for (const post of input.posts) {
		if (seenPostIds.has(post.id)) continue
		seenPostIds.add(post.id)

		const category = post.category ? categoryById.get(post.category) : undefined
		const categoryId = category?.id ?? UNCATEGORIZED_ID
		let group = categoryCounts.get(categoryId)
		if (!group) {
			group = {
				id: categoryId,
				kind: category ? "category" : "uncategorized",
				label: category?.label ?? input.labels.uncategorized,
				...(category?.colorToken ? { colorToken: category.colorToken } : {}),
				publishedPostCount: 0,
				areaValue: 0,
				topics: [],
				topicCounts: new Map(),
			}
			categoryCounts.set(categoryId, group)
		}
		group.publishedPostCount += 1

		const validTagIds = new Set(post.tags.filter((id) => tagById.has(id)))
		if (validTagIds.size === 0) {
			untaggedPostCount += 1
			group.topicCounts.set(UNTAGGED_ID, (group.topicCounts.get(UNTAGGED_ID) ?? 0) + 1)
		} else {
			for (const tagId of validTagIds) {
				tagAssignmentCount += 1
				group.topicCounts.set(tagId, (group.topicCounts.get(tagId) ?? 0) + 1)
			}
		}
	}

	const categories = Array.from(categoryCounts.values())
		.sort((a, b) => {
			if (a.kind === "uncategorized") return 1
			if (b.kind === "uncategorized") return -1
			const orderA = categoryById.get(a.id)?.sortOrder ?? 0
			const orderB = categoryById.get(b.id)?.sortOrder ?? 0
			return orderA - orderB || a.id.localeCompare(b.id)
		})
		.map(({ topicCounts, ...group }) => {
			const topics = Array.from(topicCounts, ([tagId, value]) => ({
				id: `${group.id}:${tagId}`,
				tagId: tagId === UNTAGGED_ID ? null : tagId,
				kind: tagId === UNTAGGED_ID ? ("untagged" as const) : ("tag" as const),
				label: tagId === UNTAGGED_ID ? input.labels.untagged : tagById.get(tagId)!.label,
				value,
			})).sort((a, b) => b.value - a.value || a.id.localeCompare(b.id))
			return {
				...group,
				areaValue: topics.reduce((sum, topic) => sum + topic.value, 0),
				topics,
			}
		})

	return {
		schemaVersion: 1,
		metric: "tag-usages-with-untagged",
		locale: input.locale,
		generatedAt: input.generatedAt ?? new Date().toISOString(),
		totals: {
			publishedPostCount: seenPostIds.size,
			tagAssignmentCount,
			untaggedPostCount,
			areaValue: tagAssignmentCount + untaggedPostCount,
		},
		categories,
	}
}
