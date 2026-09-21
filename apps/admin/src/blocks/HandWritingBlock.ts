import type { BlockDefinition } from "./types"
import { normalizeInput, STYLES } from "@chankay/handwriting/schema"

export const HandWritingBlock: BlockDefinition = {
	slug: "handWriting",
	labels: {
		singular: "HandWriting",
		plural: "HandWriting",
	},
	fields: [
		{
			name: "text",
			type: "text",
			label: "English text",
			defaultValue: "Hello world",
			required: true,
			maxLength: 50,
			admin: {
				description: "English letters, numbers and supported punctuation. Up to 50 characters.",
			},
			validate: (value: unknown) => {
				try {
					normalizeInput({ text: value })
					return true
				} catch {
					return "Enter 1–50 supported English characters on one line."
				}
			},
		},
		{
			name: "style",
			type: "select",
			defaultValue: "rounded",
			required: true,
			options: STYLES.map(({ id, label }) => ({ value: id, label })),
		},
		{
			name: "seed",
			type: "number",
			defaultValue: 42,
			min: 0,
			max: 4294967295,
			required: true,
			admin: { hidden: true },
			validate: (value: unknown) =>
				Number.isInteger(value) && Number(value) >= 0 && Number(value) <= 4294967295
					? true
					: "Seed must be an unsigned integer.",
		},
		{
			name: "legibility",
			type: "number",
			label: "Clarity",
			defaultValue: 0.85,
			min: 0.15,
			max: 2.5,
		},
		{
			name: "handwritingPreview",
			type: "ui",
			admin: { components: { Field: "/components/fields/HandwritingPreview#default" } },
		},
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
