import type { BlockDefinition } from "./types"

export const MarkdownBlock: BlockDefinition = {
	slug: "markdown",
	labels: {
		singular: "Markdown",
		plural: "Markdown",
	},
	fields: [
		{
			name: "content",
			type: "textarea",
			label: "Markdown Content",
			required: true,
			admin: {
				description: "Supports standard Markdown syntax.",
			},
		},
	],
}
