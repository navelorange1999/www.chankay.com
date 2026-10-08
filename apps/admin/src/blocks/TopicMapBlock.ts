import type { BlockDefinition } from "./types"

export const TopicMapBlock: BlockDefinition = {
	slug: "topicMap",
	labels: { singular: "Topic Map", plural: "Topic Maps" },
	fields: [
		{ name: "enabled", type: "checkbox", defaultValue: false },
		{ name: "title", type: "text", localized: true, required: true },
		{ name: "description", type: "textarea", localized: true },
		{
			name: "maxTopicsPerCategory",
			type: "number",
			defaultValue: 8,
			min: 3,
			max: 20,
			required: true,
		},
	],
}
