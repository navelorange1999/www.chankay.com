import type { BlockDefinition } from "./types"

export const CardBlock: BlockDefinition = {
	slug: "card",
	labels: {
		singular: "Card",
		plural: "Cards",
	},
	fields: [
		{
			name: "title",
			type: "text",
			required: true,
			label: "Card Title",
		},
		{
			name: "description",
			type: "textarea",
			label: "Card Description",
		},
	],
}
