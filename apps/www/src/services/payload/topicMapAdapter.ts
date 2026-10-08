import type { TreemapNode } from "@repo/ui/components/Treemap"
import type { TreemapTone } from "@repo/ui/components/Treemap"

import type { TopicMapResponse } from "./topicMap"

export function topicMapTones(data: TopicMapResponse): Record<string, TreemapTone> {
	return Object.fromEntries(
		data.categories.map((category) => {
			let hash = 0
			for (const char of category.id) hash = (hash * 31 + char.codePointAt(0)!) >>> 0
			return [category.id, category.colorToken ?? (`chart-${(hash % 5) + 1}` as TreemapTone)]
		})
	)
}

export function topicMapToTree(data: TopicMapResponse): TreemapNode {
	return {
		id: "topics",
		label: "Topics",
		children: data.categories.map((category) => ({
			id: category.id,
			label: category.label,
			children: category.articles.map((article) => ({
				id: `article:${article.id}`,
				label: article.title,
				value: article.value,
			})),
		})),
	}
}
