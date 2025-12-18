import type { BlockDefinition } from "./types"
import { sharedContentBlocks } from "./sharedContentBlocks"

export const HeroBlock: BlockDefinition = {
	slug: "hero",
	labels: {
		singular: "Hero",
		plural: "Heroes",
	},
	fields: [
		{
			name: "hero",
			type: "group",
			label: "Hero Section Settings",
			fields: [
				{
					name: "contentBlocks",
					type: "blocks",
					label: "Hero Content Blocks",
					admin: {
						description:
							"Add optional blocks inside the hero (e.g. Text, HandWriting, Media, Card, Button). Order matters.",
					},
					blocks: sharedContentBlocks,
				},
				{
					name: "alignment",
					type: "radio",
					label: "Alignment",
					defaultValue: "center",
					options: [
						{ label: "Left", value: "left" },
						{ label: "Center", value: "center" },
						{ label: "Right", value: "right" },
					],
				},
				{
					name: "size",
					type: "radio",
					label: "Section Height",
					defaultValue: "md",
					options: [
						{ label: "Small", value: "sm" },
						{ label: "Medium", value: "md" },
						{ label: "Large", value: "lg" },
					],
				},
				{
					name: "backgroundStyle",
					type: "radio",
					label: "Background Style",
					defaultValue: "gradient",
					options: [
						{ label: "Solid Color", value: "solid" },
						{ label: "Gradient", value: "gradient" },
						{ label: "None (Transparent)", value: "none" },
					],
				},
			],
		},
		{
			name: "spacing",
			type: "group",
			label: "Section Spacing",
			fields: [
				{
					name: "paddingTop",
					type: "radio",
					label: "Padding Top",
					defaultValue: "md",
					options: [
						{ label: "None", value: "none" },
						{ label: "Small", value: "sm" },
						{ label: "Medium", value: "md" },
						{ label: "Large", value: "lg" },
					],
				},
				{
					name: "paddingBottom",
					type: "radio",
					label: "Padding Bottom",
					defaultValue: "md",
					options: [
						{ label: "None", value: "none" },
						{ label: "Small", value: "sm" },
						{ label: "Medium", value: "md" },
						{ label: "Large", value: "lg" },
					],
				},
			],
		},
	],
}
