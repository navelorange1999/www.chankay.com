import type { BlockDefinition } from "./types"

export const ButtonBlock: BlockDefinition = {
	slug: "button",
	labels: {
		singular: "Button",
		plural: "Buttons",
	},
	fields: [
		{
			name: "label",
			type: "text",
			required: true,
			label: "Label",
		},
		{
			name: "href",
			type: "text",
			required: true,
			label: "Link",
		},
		{
			name: "variant",
			type: "radio",
			defaultValue: "primary",
			options: [
				{ label: "Primary", value: "primary" },
				{ label: "Secondary", value: "secondary" },
			],
		},
		{
			name: "external",
			type: "checkbox",
			label: "External Link",
			defaultValue: false,
		},
	],
}
