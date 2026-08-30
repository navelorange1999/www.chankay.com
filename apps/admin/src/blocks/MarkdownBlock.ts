import type { BlockDefinition } from "./types"
import { markdownField } from "@/fields/markdownField"

export const MarkdownBlock: BlockDefinition = {
	slug: "markdown",
	labels: {
		singular: "Markdown",
		plural: "Markdown",
	},
	fields: [
		markdownField({
			name: "content",
			label: "Markdown Content",
			required: true,
			localized: true,
			admin: {
				description: "Supports standard Markdown syntax with preview and media insertion.",
				rows: 18,
			},
		}),
	],
}
