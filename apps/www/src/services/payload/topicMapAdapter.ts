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

export function topicMapToTree(
	data: TopicMapResponse,
	maxTopics: number,
	otherLabel: string
): TreemapNode {
	const count = Number.isFinite(maxTopics) ? Math.min(20, Math.max(3, Math.floor(maxTopics))) : 8
	return {
		id: "topics",
		label: "Topics",
		children: data.categories.map((category) => {
			const visible = category.topics.slice(0, count)
			const omitted = category.topics.slice(count)
			const children: TreemapNode[] = visible.map((topic) => ({
				id: topic.id,
				label: topic.label,
				value: topic.value,
			}))
			if (omitted.length > 0) {
				children.push({
					id: `other:${category.id}`,
					label: otherLabel,
					value: omitted.reduce((sum, topic) => sum + topic.value, 0),
				})
			}
			return { id: category.id, label: category.label, children }
		}),
	}
}
