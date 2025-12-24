import type { BlockDefinition } from "./types"
import { sharedContentBlocks } from "./sharedContentBlocks"

type Gap = "none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl"

const gapOptions: { label: string; value: Gap }[] = [
	{ label: "None", value: "none" },
	{ label: "XS", value: "xs" },
	{ label: "SM", value: "sm" },
	{ label: "MD", value: "md" },
	{ label: "LG", value: "lg" },
	{ label: "XL", value: "xl" },
	{ label: "2XL", value: "2xl" },
]

function flexBlock(slug: string, childBlocks: BlockDefinition[]): BlockDefinition {
	return {
		slug,
		labels: {
			singular: "Flex",
			plural: "Flex",
		},
		fields: [
			{
				name: "as",
				type: "select",
				label: "Element",
				defaultValue: "div",
				options: [
					{ label: "Div", value: "div" },
					{ label: "Section", value: "section" },
					{ label: "Main", value: "main" },
					{ label: "Article", value: "article" },
					{ label: "Header", value: "header" },
					{ label: "Footer", value: "footer" },
					{ label: "Nav", value: "nav" },
					{ label: "Aside", value: "aside" },
				],
			},
			{
				name: "inline",
				type: "checkbox",
				label: "Inline",
				defaultValue: false,
			},
			{
				name: "direction",
				type: "radio",
				label: "Direction",
				defaultValue: "row",
				options: [
					{ label: "Row", value: "row" },
					{ label: "Row Reverse", value: "rowReverse" },
					{ label: "Column", value: "col" },
					{ label: "Column Reverse", value: "colReverse" },
				],
			},
			{
				name: "wrap",
				type: "radio",
				label: "Wrap",
				defaultValue: "nowrap",
				options: [
					{ label: "No Wrap", value: "nowrap" },
					{ label: "Wrap", value: "wrap" },
					{ label: "Wrap Reverse", value: "wrapReverse" },
				],
			},
			{
				name: "align",
				type: "radio",
				label: "Align Items",
				defaultValue: "stretch",
				options: [
					{ label: "Start", value: "start" },
					{ label: "Center", value: "center" },
					{ label: "End", value: "end" },
					{ label: "Stretch", value: "stretch" },
					{ label: "Baseline", value: "baseline" },
				],
			},
			{
				name: "justify",
				type: "radio",
				label: "Justify Content",
				defaultValue: "start",
				options: [
					{ label: "Start", value: "start" },
					{ label: "Center", value: "center" },
					{ label: "End", value: "end" },
					{ label: "Between", value: "between" },
					{ label: "Around", value: "around" },
					{ label: "Evenly", value: "evenly" },
				],
			},
			{
				name: "gap",
				type: "radio",
				label: "Gap",
				defaultValue: "md",
				options: gapOptions,
			},
			{
				name: "className",
				type: "text",
				label: "Class Name",
				admin: {
					description:
						"Tailwind classes (advanced). Prefer using the config options above when possible.",
				},
			},
			{
				name: "children",
				type: "blocks",
				label: "Children",
				admin: {
					description: "Nest Structure and Content blocks (max depth: 4)",
				},
				blocks: childBlocks,
			},
		],
	}
}

function gridBlock(slug: string, childBlocks: BlockDefinition[]): BlockDefinition {
	return {
		slug,
		labels: {
			singular: "Grid",
			plural: "Grids",
		},
		fields: [
			{
				name: "as",
				type: "select",
				label: "Element",
				defaultValue: "div",
				options: [
					{ label: "Div", value: "div" },
					{ label: "Section", value: "section" },
					{ label: "Main", value: "main" },
					{ label: "Article", value: "article" },
					{ label: "Header", value: "header" },
					{ label: "Footer", value: "footer" },
					{ label: "Nav", value: "nav" },
					{ label: "Aside", value: "aside" },
				],
			},
			{
				name: "columns",
				type: "number",
				label: "Columns",
				defaultValue: 1,
				min: 1,
				max: 12,
			},
			{
				name: "columnsSm",
				type: "number",
				label: "Columns (sm)",
				min: 1,
				max: 12,
			},
			{
				name: "columnsMd",
				type: "number",
				label: "Columns (md)",
				min: 1,
				max: 12,
			},
			{
				name: "columnsLg",
				type: "number",
				label: "Columns (lg)",
				min: 1,
				max: 12,
			},
			{
				name: "gap",
				type: "radio",
				label: "Gap",
				defaultValue: "md",
				options: gapOptions,
			},
			{
				name: "alignItems",
				type: "radio",
				label: "Align Items",
				defaultValue: "stretch",
				options: [
					{ label: "Start", value: "start" },
					{ label: "Center", value: "center" },
					{ label: "End", value: "end" },
					{ label: "Stretch", value: "stretch" },
					{ label: "Baseline", value: "baseline" },
				],
			},
			{
				name: "justifyItems",
				type: "radio",
				label: "Justify Items",
				defaultValue: "stretch",
				options: [
					{ label: "Start", value: "start" },
					{ label: "Center", value: "center" },
					{ label: "End", value: "end" },
					{ label: "Stretch", value: "stretch" },
				],
			},
			{
				name: "className",
				type: "text",
				label: "Class Name",
				admin: {
					description:
						"Tailwind classes (advanced). Prefer using the config options above when possible.",
				},
			},
			{
				name: "children",
				type: "blocks",
				label: "Children",
				admin: {
					description: "Nest Structure and Content blocks (max depth: 4)",
				},
				blocks: childBlocks,
			},
		],
	}
}

function containerBlock(slug: string, childBlocks: BlockDefinition[]): BlockDefinition {
	return {
		slug,
		labels: {
			singular: "Container",
			plural: "Containers",
		},
		fields: [
			{
				name: "size",
				type: "radio",
				label: "Size",
				defaultValue: "default",
				options: [
					{ label: "Default", value: "default" },
					{ label: "Wide", value: "wide" },
					{ label: "Full", value: "full" },
				],
			},
			{
				name: "className",
				type: "text",
				label: "Class Name",
				admin: {
					description:
						"Tailwind classes (advanced). Prefer using the config options above when possible.",
				},
			},
			{
				name: "children",
				type: "blocks",
				label: "Children",
				admin: {
					description: "Nest Structure and Content blocks (max depth: 4)",
				},
				blocks: childBlocks,
			},
		],
	}
}

function cardBlock(slug: string, childBlocks: BlockDefinition[]): BlockDefinition {
	return {
		slug,
		labels: {
			singular: "Card (Structure)",
			plural: "Cards (Structure)",
		},
		fields: [
			{
				name: "className",
				type: "text",
				label: "Class Name",
				admin: {
					description:
						"Tailwind classes (advanced). Prefer using the config options above when possible.",
				},
			},
			{
				name: "children",
				type: "blocks",
				label: "Children",
				admin: {
					description: "Nest Structure and Content blocks (max depth: 4)",
				},
				blocks: childBlocks,
			},
		],
	}
}

// Depth 4: structure nodes can contain only leaf content blocks (no more structure nesting)
const childBlocksLevel4: BlockDefinition[] = [...sharedContentBlocks]
const structureBlocksLevel4: BlockDefinition[] = [
	containerBlock("structureContainer4", childBlocksLevel4),
	flexBlock("structureFlex4", childBlocksLevel4),
	gridBlock("structureGrid4", childBlocksLevel4),
	cardBlock("structureCard4", childBlocksLevel4),
]

// Depth 3
const childBlocksLevel3: BlockDefinition[] = [...structureBlocksLevel4, ...sharedContentBlocks]
const structureBlocksLevel3: BlockDefinition[] = [
	containerBlock("structureContainer3", childBlocksLevel3),
	flexBlock("structureFlex3", childBlocksLevel3),
	gridBlock("structureGrid3", childBlocksLevel3),
	cardBlock("structureCard3", childBlocksLevel3),
]

// Depth 2
const childBlocksLevel2: BlockDefinition[] = [...structureBlocksLevel3, ...sharedContentBlocks]
const structureBlocksLevel2: BlockDefinition[] = [
	containerBlock("structureContainer2", childBlocksLevel2),
	flexBlock("structureFlex2", childBlocksLevel2),
	gridBlock("structureGrid2", childBlocksLevel2),
	cardBlock("structureCard2", childBlocksLevel2),
]

// Depth 1 (top-level)
const childBlocksLevel1: BlockDefinition[] = [...structureBlocksLevel2, ...sharedContentBlocks]
export const structureBlocksLevel1: BlockDefinition[] = [
	containerBlock("structureContainer1", childBlocksLevel1),
	flexBlock("structureFlex1", childBlocksLevel1),
	gridBlock("structureGrid1", childBlocksLevel1),
	cardBlock("structureCard1", childBlocksLevel1),
]

export const structureBlocks: BlockDefinition[] = [...structureBlocksLevel1, ...sharedContentBlocks]
