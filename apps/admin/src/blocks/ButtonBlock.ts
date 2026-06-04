import type { BlockDefinition } from "./types"
import { buttonIconOptions } from "@repo/ui"

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
			label: "Label",
			localized: true,
			admin: {
				description: "Optional when size is Icon and an icon is selected.",
			},
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
			label: "Variant",
			defaultValue: "default",
			options: [
				{ label: "Default", value: "default" },
				{ label: "Secondary", value: "secondary" },
				{ label: "Outline", value: "outline" },
				{ label: "Ghost", value: "ghost" },
				{ label: "Link", value: "link" },
				{ label: "Destructive", value: "destructive" },
				{ label: "Primary (Legacy)", value: "primary" },
			],
		},
		{
			name: "size",
			type: "radio",
			label: "Size",
			defaultValue: "default",
			options: [
				{ label: "Default", value: "default" },
				{ label: "Small", value: "sm" },
				{ label: "Large", value: "lg" },
				{ label: "Icon", value: "icon" },
			],
		},
		{
			name: "icon",
			type: "select",
			label: "Icon",
			defaultValue: "none",
			options: [...buttonIconOptions],
		},
		{
			name: "iconPosition",
			type: "radio",
			label: "Icon Position",
			defaultValue: "left",
			options: [
				{ label: "Left", value: "left" },
				{ label: "Right", value: "right" },
			],
			admin: {
				condition: (_, siblingData) => siblingData?.icon && siblingData?.icon !== "none",
			},
		},
		{
			name: "external",
			type: "checkbox",
			label: "External Link",
			defaultValue: false,
		},
	],
}
