import * as React from "react"

import { Container, Flex, Grid } from "@repo/ui"
import type { Page } from "@repo/typescript-config/typings/payload-types"

import { isLeafBlock, renderLeafBlock } from "@/components/nodes/leafRenderers"

type StructureBlocks = NonNullable<Page["structure"]>
type StructureBlock = StructureBlocks[number]

type Gap = "none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl"
type ElementAs = "div" | "section" | "main" | "article" | "header" | "footer" | "nav" | "aside"
type GridColumns = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12

type StructureLike = StructureBlock & { children?: StructureBlock[] | null }

function asOptionalString(value: unknown): string | undefined {
	return typeof value === "string" && value.length > 0 ? value : undefined
}

function asRecord(value: unknown): Record<string, unknown> {
	if (!value || typeof value !== "object") return {}
	return value as Record<string, unknown>
}

function asGap(value: unknown, fallback: Gap): Gap {
	const allowed: Gap[] = ["none", "xs", "sm", "md", "lg", "xl", "2xl"]
	return allowed.includes(value as Gap) ? (value as Gap) : fallback
}

function asElementAs(value: unknown, fallback: ElementAs): ElementAs {
	const allowed: ElementAs[] = [
		"div",
		"section",
		"main",
		"article",
		"header",
		"footer",
		"nav",
		"aside",
	]
	return allowed.includes(value as ElementAs) ? (value as ElementAs) : fallback
}

function asGridColumns(value: unknown, fallback: GridColumns): GridColumns {
	const num = typeof value === "number" && Number.isFinite(value) ? value : fallback
	const clamped = Math.min(12, Math.max(1, Math.round(num)))
	return clamped as GridColumns
}

function isOneOf<T extends string>(value: unknown, allowed: readonly T[]): value is T {
	return typeof value === "string" && allowed.includes(value as T)
}

function renderBlocks(blocks: StructureBlock[] | null | undefined) {
	if (!blocks || blocks.length === 0) return null
	return blocks.map((block, index) => renderBlock(block, block.id ?? `${block.blockType}-${index}`))
}

function isStructureBlockType(blockType: string) {
	return (
		blockType.startsWith("structureContainer") ||
		blockType.startsWith("structureFlex") ||
		blockType.startsWith("structureGrid") ||
		blockType.startsWith("structureCard")
	)
}

function renderBlock(block: StructureBlock, key: string): React.ReactNode {
	if (!block) return null

	if (isStructureBlockType(block.blockType)) {
		const node = block as unknown as StructureLike
		const data = asRecord(node)
		const children = node.children

		if (block.blockType.startsWith("structureContainer")) {
			return (
				<Container
					key={key}
					size={
						isOneOf(asOptionalString(data.size), ["default", "wide", "full"] as const)
							? (asOptionalString(data.size) as "default" | "wide" | "full")
							: "default"
					}
				>
					{renderBlocks(children)}
				</Container>
			)
		}

		if (block.blockType.startsWith("structureFlex")) {
			return (
				<Flex
					key={key}
					as={asElementAs(data.as, "div")}
					inline={Boolean(data.inline)}
					direction={
						isOneOf(asOptionalString(data.direction), [
							"row",
							"rowReverse",
							"col",
							"colReverse",
						] as const)
							? (asOptionalString(data.direction) as "row" | "rowReverse" | "col" | "colReverse")
							: "row"
					}
					wrap={
						isOneOf(asOptionalString(data.wrap), ["nowrap", "wrap", "wrapReverse"] as const)
							? (asOptionalString(data.wrap) as "nowrap" | "wrap" | "wrapReverse")
							: "nowrap"
					}
					align={
						isOneOf(asOptionalString(data.align), [
							"start",
							"center",
							"end",
							"stretch",
							"baseline",
						] as const)
							? (asOptionalString(data.align) as
									| "start"
									| "center"
									| "end"
									| "stretch"
									| "baseline")
							: "stretch"
					}
					justify={
						isOneOf(asOptionalString(data.justify), [
							"start",
							"center",
							"end",
							"between",
							"around",
							"evenly",
						] as const)
							? (asOptionalString(data.justify) as
									| "start"
									| "center"
									| "end"
									| "between"
									| "around"
									| "evenly")
							: "start"
					}
					gap={asGap(data.gap, "md")}
				>
					{renderBlocks(children)}
				</Flex>
			)
		}

		if (block.blockType.startsWith("structureGrid")) {
			return (
				<Grid
					key={key}
					as={asElementAs(data.as, "div")}
					columns={asGridColumns(data.columns, 1)}
					columnsSm={
						typeof data.columnsSm === "number" ? asGridColumns(data.columnsSm, 1) : undefined
					}
					columnsMd={
						typeof data.columnsMd === "number" ? asGridColumns(data.columnsMd, 1) : undefined
					}
					columnsLg={
						typeof data.columnsLg === "number" ? asGridColumns(data.columnsLg, 1) : undefined
					}
					gap={asGap(data.gap, "md")}
					alignItems={
						isOneOf(asOptionalString(data.alignItems), [
							"start",
							"center",
							"end",
							"stretch",
							"baseline",
						] as const)
							? (asOptionalString(data.alignItems) as
									| "start"
									| "center"
									| "end"
									| "stretch"
									| "baseline")
							: "stretch"
					}
					justifyItems={
						isOneOf(asOptionalString(data.justifyItems), [
							"start",
							"center",
							"end",
							"stretch",
						] as const)
							? (asOptionalString(data.justifyItems) as "start" | "center" | "end" | "stretch")
							: "stretch"
					}
				>
					{renderBlocks(children)}
				</Grid>
			)
		}
	}

	if (isLeafBlock(block)) {
		return renderLeafBlock(block, key)
	}

	return null
}

export interface NodesProps {
	nodes: Page["structure"]
}

export function Nodes({ nodes }: NodesProps) {
	if (!nodes) return null
	if (nodes.length === 0) return null

	return (
		<>
			{nodes.map((block, index) => renderBlock(block, block.id ?? `${block.blockType}-${index}`))}
		</>
	)
}
