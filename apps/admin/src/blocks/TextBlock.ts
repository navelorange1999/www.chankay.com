import type { BlockDefinition } from "./types"

export const TextBlock: BlockDefinition = {
	slug: "text",
	labels: {
		singular: "Text",
		plural: "Text",
	},
	fields: [
		{
			name: "content",
			type: "textarea",
			label: "Content",
		},
		{
			name: "as",
			type: "select",
			label: "Element",
			defaultValue: "p",
			options: [
				{ label: "Paragraph", value: "p" },
				{ label: "Span", value: "span" },
				{ label: "Heading 1", value: "h1" },
				{ label: "Heading 2", value: "h2" },
				{ label: "Heading 3", value: "h3" },
				{ label: "Heading 4", value: "h4" },
			],
		},
		{
			name: "size",
			type: "select",
			label: "Size",
			defaultValue: "base",
			options: [
				{ label: "XS", value: "xs" },
				{ label: "SM", value: "sm" },
				{ label: "Base", value: "base" },
				{ label: "LG", value: "lg" },
				{ label: "XL", value: "xl" },
				{ label: "2XL", value: "2xl" },
			],
		},
		{
			name: "weight",
			type: "select",
			label: "Weight",
			defaultValue: "normal",
			options: [
				{ label: "Normal", value: "normal" },
				{ label: "Medium", value: "medium" },
				{ label: "Semi Bold", value: "semibold" },
				{ label: "Bold", value: "bold" },
			],
		},
		{
			name: "tone",
			type: "select",
			label: "Tone",
			defaultValue: "default",
			options: [
				{ label: "Default", value: "default" },
				{ label: "Muted", value: "muted" },
				{ label: "Primary", value: "primary" },
				{ label: "Accent", value: "accent" },
			],
		},
		{
			name: "align",
			type: "select",
			label: "Align",
			defaultValue: "left",
			options: [
				{ label: "Left", value: "left" },
				{ label: "Center", value: "center" },
				{ label: "Right", value: "right" },
			],
		},
	],
}
