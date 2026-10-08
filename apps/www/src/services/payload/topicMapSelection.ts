export function resolveTopicMapSelection<
	C extends { id: string; topics: readonly { id: string }[] },
>(
	categories: readonly C[],
	selected: { category: { id: string }; topic: { id: string } } | null
): { category: C; topic: C["topics"][number] } | null {
	if (!selected) return null
	const category = categories.find((candidate) => candidate.id === selected.category.id)
	const topic = category?.topics.find((candidate) => candidate.id === selected.topic.id)
	return category && topic ? { category, topic } : null
}
