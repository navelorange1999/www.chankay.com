import type { BlockDefinition } from "./types"
import { ButtonBlock } from "./ButtonBlock"
import { TextBlock } from "./TextBlock"

export const CardBlock: BlockDefinition = {
	slug: "card",
	labels: {
		singular: "Card",
		plural: "Cards",
	},
	fields: [
		{
			name: "className",
			type: "text",
			label: "Card Class Name",
			admin: {
				description: "Tailwind classes for the outer Card container. Leave empty to use defaults.",
			},
		},
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
			name: "headerClassName",
			type: "text",
			label: "Header Class Name",
			admin: {
				condition: (_, siblingData) => siblingData?.showHeader !== false,
			},
		},
		{
			name: "titleClassName",
			type: "text",
			label: "Title Class Name",
			admin: {
				condition: (_, siblingData) => siblingData?.showHeader !== false,
			},
		},
		{
			name: "descriptionClassName",
			type: "text",
			label: "Description Class Name",
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
			name: "content",
			type: "textarea",
			label: "Card Content",
			admin: {
				condition: (_, siblingData) => siblingData?.showContent !== false,
			},
		},
		{
			name: "contentClassName",
			type: "text",
			label: "Content Class Name",
			admin: {
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
			name: "footerClassName",
			type: "text",
			label: "Footer Class Name",
			admin: {
				condition: (_, siblingData) => siblingData?.showFooter === true,
			},
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
