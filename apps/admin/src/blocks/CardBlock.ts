import type { BlockDefinition } from "./types"
import { ButtonBlock } from "./ButtonBlock"
import { HandWritingBlock } from "./HandWritingBlock"
import { HeatmapBlock } from "./HeatmapBlock"
import { MarkdownBlock } from "./MarkdownBlock"
import { MediaImageBlock } from "./MediaImageBlock"
import { SpotifyIframeBlock } from "./SpotifyIframeBlock"
import { TextBlock } from "./TextBlock"

const cardContentBlocks: BlockDefinition[] = [
	TextBlock,
	MarkdownBlock,
	HandWritingBlock,
	HeatmapBlock,
	MediaImageBlock,
	ButtonBlock,
	SpotifyIframeBlock,
]

export const CardBlock: BlockDefinition = {
	slug: "card",
	labels: {
		singular: "Card",
		plural: "Cards",
	},
	fields: [
		{
			name: "showHeader",
			type: "checkbox",
			label: "Show Header",
			defaultValue: true,
		},
		{
			name: "title",
			type: "text",
			label: "Card Title",
			admin: {
				condition: (_, siblingData) => siblingData?.showHeader !== false,
			},
		},
		{
			name: "description",
			type: "textarea",
			label: "Card Description",
			admin: {
				condition: (_, siblingData) => siblingData?.showHeader !== false,
			},
		},
		{
			name: "actionBlocks",
			type: "blocks",
			label: "Header Action Blocks",
			blocks: [ButtonBlock, TextBlock],
			admin: {
				description: "Only Button and Text blocks are supported.",
				condition: (_, siblingData) => siblingData?.showHeader !== false,
			},
		},
		{
			name: "showContent",
			type: "checkbox",
			label: "Show Content",
			defaultValue: true,
		},
		{
			name: "contentBlocks",
			type: "blocks",
			label: "Content Blocks",
			blocks: cardContentBlocks,
			admin: {
				description: "Use content blocks inside the card body.",
				condition: (_, siblingData) => siblingData?.showContent !== false,
			},
		},
		{
			name: "showFooter",
			type: "checkbox",
			label: "Show Footer",
			defaultValue: false,
		},
		{
			name: "footerBlocks",
			type: "blocks",
			label: "Footer Blocks",
			blocks: [ButtonBlock, TextBlock],
			admin: {
				description: "Only Button and Text blocks are supported.",
				condition: (_, siblingData) => siblingData?.showFooter === true,
			},
		},
	],
}
