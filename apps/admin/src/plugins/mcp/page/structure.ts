import type { Page } from "@repo/typescript-config/typings/payload-types"
import { z } from "zod"

const containerSizeOptions = ["default", "wide", "full"] as const
const layoutElementOptions = [
	"div",
	"section",
	"main",
	"article",
	"header",
	"footer",
	"nav",
	"aside",
] as const
const flexDirectionOptions = ["row", "rowReverse", "col", "colReverse"] as const
const flexWrapOptions = ["nowrap", "wrap", "wrapReverse"] as const
const flexAlignOptions = ["start", "center", "end", "stretch", "baseline"] as const
const flexJustifyOptions = ["start", "center", "end", "between", "around", "evenly"] as const
const gapOptions = ["none", "xs", "sm", "md", "lg", "xl", "2xl"] as const
const textElementOptions = ["p", "span", "h1", "h2", "h3", "h4"] as const
const textSizeOptions = ["xs", "sm", "base", "lg", "xl", "2xl"] as const
const textWeightOptions = ["normal", "medium", "semibold", "bold"] as const
const textToneOptions = ["default", "muted", "primary", "accent"] as const
const textAlignOptions = ["left", "center", "right"] as const

type PageTextNodeInput = {
	type: "text"
	align?: (typeof textAlignOptions)[number]
	as?: (typeof textElementOptions)[number]
	content: string
	size?: (typeof textSizeOptions)[number]
	tone?: (typeof textToneOptions)[number]
	weight?: (typeof textWeightOptions)[number]
}

type PageMarkdownNodeInput = {
	type: "markdown"
	content: string
}

type PageContainerNodeInput = {
	type: "container"
	children?: PageStructureNodeInput[]
	size?: (typeof containerSizeOptions)[number]
}

type PageFlexNodeInput = {
	type: "flex"
	align?: (typeof flexAlignOptions)[number]
	as?: (typeof layoutElementOptions)[number]
	children?: PageStructureNodeInput[]
	direction?: (typeof flexDirectionOptions)[number]
	gap?: (typeof gapOptions)[number]
	inline?: boolean
	justify?: (typeof flexJustifyOptions)[number]
	wrap?: (typeof flexWrapOptions)[number]
}

type PageGridNodeInput = {
	type: "grid"
	alignItems?: (typeof flexAlignOptions)[number]
	as?: (typeof layoutElementOptions)[number]
	children?: PageStructureNodeInput[]
	columns?: number
	columnsLg?: number
	columnsMd?: number
	columnsSm?: number
	gap?: (typeof gapOptions)[number]
	justifyItems?: "start" | "center" | "end" | "stretch"
}

export type PageStructureNodeInput =
	| PageContainerNodeInput
	| PageFlexNodeInput
	| PageGridNodeInput
	| PageTextNodeInput
	| PageMarkdownNodeInput

export type PayloadPageStructure = NonNullable<Page["structure"]>

const textNodeSchema = z.object({
	align: z.enum(textAlignOptions).optional(),
	as: z.enum(textElementOptions).optional(),
	content: z.string().min(1),
	size: z.enum(textSizeOptions).optional(),
	tone: z.enum(textToneOptions).optional(),
	type: z.literal("text"),
	weight: z.enum(textWeightOptions).optional(),
})

const markdownNodeSchema = z.object({
	content: z.string().min(1),
	type: z.literal("markdown"),
})

export const pageStructureNodeSchema: z.ZodType<PageStructureNodeInput> = z.lazy(() =>
	z.discriminatedUnion("type", [
		z.object({
			children: z.array(pageStructureNodeSchema).optional(),
			size: z.enum(containerSizeOptions).optional(),
			type: z.literal("container"),
		}),
		z.object({
			align: z.enum(flexAlignOptions).optional(),
			as: z.enum(layoutElementOptions).optional(),
			children: z.array(pageStructureNodeSchema).optional(),
			direction: z.enum(flexDirectionOptions).optional(),
			gap: z.enum(gapOptions).optional(),
			inline: z.boolean().optional(),
			justify: z.enum(flexJustifyOptions).optional(),
			type: z.literal("flex"),
			wrap: z.enum(flexWrapOptions).optional(),
		}),
		z.object({
			alignItems: z.enum(flexAlignOptions).optional(),
			as: z.enum(layoutElementOptions).optional(),
			children: z.array(pageStructureNodeSchema).optional(),
			columns: z.number().int().min(1).max(12).optional(),
			columnsLg: z.number().int().min(1).max(12).optional(),
			columnsMd: z.number().int().min(1).max(12).optional(),
			columnsSm: z.number().int().min(1).max(12).optional(),
			gap: z.enum(gapOptions).optional(),
			justifyItems: z.enum(["start", "center", "end", "stretch"]).optional(),
			type: z.literal("grid"),
		}),
		textNodeSchema,
		markdownNodeSchema,
	])
)

const isStructureNode = (
	node: PageStructureNodeInput
): node is PageContainerNodeInput | PageFlexNodeInput | PageGridNodeInput => {
	return node.type === "container" || node.type === "flex" || node.type === "grid"
}

const convertPageStructureNode = (
	node: PageStructureNodeInput,
	depth: number
): PayloadPageStructure[number] => {
	if (isStructureNode(node) && depth > 4) {
		throw new Error("Page structure nesting exceeds the supported maximum depth of 4.")
	}

	switch (node.type) {
		case "container":
			return {
				blockType: `structureContainer${depth}`,
				children: convertPageStructure(node.children || [], depth + 1),
				size: node.size,
			} as PayloadPageStructure[number]
		case "flex":
			return {
				align: node.align,
				as: node.as,
				blockType: `structureFlex${depth}`,
				children: convertPageStructure(node.children || [], depth + 1),
				direction: node.direction,
				gap: node.gap,
				inline: node.inline,
				justify: node.justify,
				wrap: node.wrap,
			} as PayloadPageStructure[number]
		case "grid":
			return {
				alignItems: node.alignItems,
				as: node.as,
				blockType: `structureGrid${depth}`,
				children: convertPageStructure(node.children || [], depth + 1),
				columns: node.columns,
				columnsLg: node.columnsLg,
				columnsMd: node.columnsMd,
				columnsSm: node.columnsSm,
				gap: node.gap,
				justifyItems: node.justifyItems,
			} as PayloadPageStructure[number]
		case "text":
			return {
				align: node.align,
				as: node.as,
				blockType: "text",
				content: node.content,
				size: node.size,
				tone: node.tone,
				weight: node.weight,
			} as PayloadPageStructure[number]
		case "markdown":
			return {
				blockType: "markdown",
				content: node.content,
			} as PayloadPageStructure[number]
	}
}

export const convertPageStructure = (
	nodes: PageStructureNodeInput[],
	depth = 1
): PayloadPageStructure => {
	return nodes.map((node) => convertPageStructureNode(node, depth)) as PayloadPageStructure
}

export const countPageStructureNodes = (nodes: PageStructureNodeInput[]): number => {
	return nodes.reduce((count, node) => {
		if (isStructureNode(node)) {
			return count + 1 + countPageStructureNodes(node.children || [])
		}

		return count + 1
	}, 0)
}
