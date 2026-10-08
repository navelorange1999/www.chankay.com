export type ChartTone = "chart-1" | "chart-2" | "chart-3" | "chart-4" | "chart-5"
export type TopicMapPost = { id: string; category: string | null; title: string; slug: string }
export type TopicMapCategory = {
	id: string
	label: string
	sortOrder?: number | null
	colorToken?: ChartTone | null
}
export type TopicMapResponse = {
	schemaVersion: 2
	metric: "published-posts"
	locale: string
	generatedAt: string
	totals: { publishedPostCount: number; areaValue: number }
	categories: Array<{
		id: string
		kind: "category" | "uncategorized"
		label: string
		colorToken?: ChartTone
		publishedPostCount: number
		areaValue: number
		articles: Array<{ id: string; slug: string; title: string; value: 1 }>
	}>
}
type AggregateInput = {
	posts: readonly TopicMapPost[]
	categories: readonly TopicMapCategory[]
	locale: string
	labels: { uncategorized: string }
	generatedAt?: string
}
export function aggregateTopicMap(input: AggregateInput): TopicMapResponse {
	const categoryById = new Map(input.categories.map((category) => [category.id, category]))
	const groups = new Map<string, TopicMapResponse["categories"][number]>()
	const seen = new Set<string>()
	for (const post of input.posts) {
		if (seen.has(post.id)) continue
		seen.add(post.id)
		const category = post.category ? categoryById.get(post.category) : undefined
		const id = category?.id ?? "synthetic:uncategorized"
		let group = groups.get(id)
		if (!group) {
			group = {
				id,
				kind: category ? "category" : "uncategorized",
				label: category?.label ?? input.labels.uncategorized,
				...(category?.colorToken ? { colorToken: category.colorToken } : {}),
				publishedPostCount: 0,
				areaValue: 0,
				articles: [],
			}
			groups.set(id, group)
		}
		group.publishedPostCount += 1
		group.areaValue += 1
		group.articles.push({ id: post.id, slug: post.slug, title: post.title, value: 1 })
	}
	const categories = [...groups.values()].sort((a, b) => {
		if (a.kind === "uncategorized") return 1
		if (b.kind === "uncategorized") return -1
		return (
			(categoryById.get(a.id)?.sortOrder ?? 0) - (categoryById.get(b.id)?.sortOrder ?? 0) ||
			a.id.localeCompare(b.id)
		)
	})
	return {
		schemaVersion: 2,
		metric: "published-posts",
		locale: input.locale,
		generatedAt: input.generatedAt ?? new Date().toISOString(),
		totals: { publishedPostCount: seen.size, areaValue: seen.size },
		categories,
	}
}
