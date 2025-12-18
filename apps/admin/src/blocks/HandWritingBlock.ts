import type { BlockDefinition } from "./types"

export const HandWritingBlock: BlockDefinition = {
	slug: "handWriting",
	labels: {
		singular: "HandWriting",
		plural: "HandWriting",
	},
	fields: [
		{
			name: "speed",
			type: "number",
			label: "Animation Speed",
			defaultValue: 1,
			min: 0.1,
			max: 10,
		},
		{
			name: "as",
			type: "select",
			label: "Element",
			defaultValue: "div",
			options: [
				{ label: "Paragraph", value: "p" },
				{ label: "Span", value: "span" },
				{ label: "Heading 1", value: "h1" },
				{ label: "Heading 2", value: "h2" },
				{ label: "Heading 3", value: "h3" },
				{ label: "Heading 4", value: "h4" },
				{ label: "Div", value: "div" },
			],
		},
	],
}
