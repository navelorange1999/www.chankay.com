import * as React from "react"
import Link from "next/link"

import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Container,
	Flex,
	Grid,
	HandWriting,
	ImageMedia,
	SpotifyIframe,
	Text,
} from "@repo/ui"
import type { MediaInterface, Page } from "@repo/typescript-config/typings/payload-types"

import { HeatmapNode } from "@/components/nodes/HeatmapNode"

type StructureBlocks = NonNullable<Page["structure"]>
type StructureBlock = StructureBlocks[number]

type Gap = "none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl"
type ElementAs = "div" | "section" | "main" | "article" | "header" | "footer" | "nav" | "aside"
type GridColumns = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12

type StructureLike = StructureBlock & { children?: StructureBlock[] | null }

function asOptionalString(value: unknown): string | undefined {
	return typeof value === "string" && value.length > 0 ? value : undefined
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

function asNumber(value: unknown): number | undefined {
	return typeof value === "number" && Number.isFinite(value) ? value : undefined
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
		const children = node.children

		if (block.blockType.startsWith("structureContainer")) {
			return (
				<Container
					key={key}
					size={
						isOneOf((node as any).size, ["default", "wide", "full"] as const)
							? (node as any).size
							: "default"
					}
					className={asOptionalString((node as any).className)}
				>
					{renderBlocks(children)}
				</Container>
			)
		}

		if (block.blockType.startsWith("structureFlex")) {
			return (
				<Flex
					key={key}
					as={asElementAs((node as any).as, "div")}
					inline={Boolean((node as any).inline)}
					direction={
						isOneOf((node as any).direction, ["row", "rowReverse", "col", "colReverse"] as const)
							? (node as any).direction
							: "row"
					}
					wrap={
						isOneOf((node as any).wrap, ["nowrap", "wrap", "wrapReverse"] as const)
							? (node as any).wrap
							: "nowrap"
					}
					align={
						isOneOf((node as any).align, ["start", "center", "end", "stretch", "baseline"] as const)
							? (node as any).align
							: "stretch"
					}
					justify={
						isOneOf((node as any).justify, [
							"start",
							"center",
							"end",
							"between",
							"around",
							"evenly",
						] as const)
							? (node as any).justify
							: "start"
					}
					gap={asGap((node as any).gap, "md")}
					className={asOptionalString((node as any).className)}
				>
					{renderBlocks(children)}
				</Flex>
			)
		}

		if (block.blockType.startsWith("structureGrid")) {
			return (
				<Grid
					key={key}
					as={asElementAs((node as any).as, "div")}
					columns={asGridColumns((node as any).columns, 1)}
					columnsSm={
						typeof (node as any).columnsSm === "number"
							? asGridColumns((node as any).columnsSm, 1)
							: undefined
					}
					columnsMd={
						typeof (node as any).columnsMd === "number"
							? asGridColumns((node as any).columnsMd, 1)
							: undefined
					}
					columnsLg={
						typeof (node as any).columnsLg === "number"
							? asGridColumns((node as any).columnsLg, 1)
							: undefined
					}
					gap={asGap((node as any).gap, "md")}
					alignItems={
						isOneOf((node as any).alignItems, [
							"start",
							"center",
							"end",
							"stretch",
							"baseline",
						] as const)
							? (node as any).alignItems
							: "stretch"
					}
					justifyItems={
						isOneOf((node as any).justifyItems, ["start", "center", "end", "stretch"] as const)
							? (node as any).justifyItems
							: "stretch"
					}
					className={asOptionalString((node as any).className)}
				>
					{renderBlocks(children)}
				</Grid>
			)
		}

		if (block.blockType.startsWith("structureCard")) {
			return (
				<Card key={key} className={asOptionalString((node as any).className)}>
					<CardContent className="flex flex-col gap-6">{renderBlocks(children)}</CardContent>
				</Card>
			)
		}
	}

	switch (block.blockType) {
		case "text": {
			const content = block.content
			if (!content) return null

			return (
				<Text
					key={key}
					as={block.as ?? "p"}
					size={block.size ?? "base"}
					weight={block.weight ?? "normal"}
					tone={block.tone ?? "default"}
					align={block.align ?? "left"}
					className="whitespace-pre-wrap"
				>
					{content}
				</Text>
			)
		}

		case "handWriting":
			return (
				<div key={key} className="flex justify-center text-primary">
					<HandWriting className="h-64 w-128" speed={block.speed ?? 1} as={block.as ?? "div"} />
				</div>
			)

		case "mediaImage":
			return (
				<div key={key} className="mx-auto w-full max-w-3xl">
					<ImageMedia
						pictureClassName="block relative w-full aspect-[16/9] overflow-hidden rounded-xl border"
						imgClassName="object-cover"
						fill
						resource={block.media as MediaInterface | string}
						priority
					/>
				</div>
			)

		case "card":
			return (
				<Card key={key} className="mx-auto w-full max-w-2xl">
					<CardHeader>
						<CardTitle>{block.title}</CardTitle>
						{block.description && <CardDescription>{block.description}</CardDescription>}
					</CardHeader>
					<CardContent />
				</Card>
			)

		case "button":
			return (
				<div key={key} className="flex justify-center">
					<Button asChild variant={block.variant === "secondary" ? "secondary" : "default"}>
						<Link href={block.href} target={block.external ? "_blank" : undefined}>
							{block.label}
						</Link>
					</Button>
				</div>
			)

		case "heatmap":
			return <HeatmapNode key={key} block={block} />

		case "spotifyIframe": {
			const data = block as unknown as Record<string, unknown>
			const uri = asOptionalString(data.uri)
			const height = asNumber(data.height) ?? 352

			if (!uri) return null

			return (
				<div key={key} className="mx-auto w-full max-w-3xl">
					<SpotifyIframe uri={uri} height={height} />
				</div>
			)
		}

		default:
			return null
	}
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
