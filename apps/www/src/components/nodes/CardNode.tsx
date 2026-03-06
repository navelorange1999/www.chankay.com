import * as React from "react"

import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
	Text,
} from "@repo/ui"
import type { Page } from "@repo/typescript-config/typings/payload-types"

import { renderButtonBlock } from "@/components/nodes/ButtonNode"
import { HandWritingNode, type HandWritingNodeProps } from "@/components/nodes/HandWritingNode"
import { HeatmapNode, type HeatmapNodeProps } from "@/components/nodes/HeatmapNode"
import { MarkdownNode, type MarkdownNodeProps } from "@/components/nodes/MarkdownNode"
import { MediaImageNode, type MediaImageNodeProps } from "@/components/nodes/MediaImageNode"
import {
	SpotifyIframeNode,
	type SpotifyIframeNodeProps,
} from "@/components/nodes/SpotifyIframeNode"

type CardBlock = Extract<NonNullable<Page["structure"]>[number], { blockType: "card" }>

export interface CardNodeProps {
	block: CardBlock
}

function asOptionalString(value: unknown): string | undefined {
	return typeof value === "string" && value.length > 0 ? value : undefined
}

function asBooleanWithDefault(value: unknown, fallback: boolean): boolean {
	return typeof value === "boolean" ? value : fallback
}

function asArray(value: unknown): Record<string, unknown>[] {
	if (!Array.isArray(value)) return []
	return value.filter((item) => item && typeof item === "object") as Record<string, unknown>[]
}

const textAs = ["p", "span", "div", "h1", "h2", "h3", "h4"] as const
const textSizes = ["xs", "sm", "base", "lg", "xl", "2xl"] as const
const textWeights = ["normal", "medium", "semibold", "bold"] as const
const textTones = ["default", "muted", "primary", "accent"] as const
const textAligns = ["left", "center", "right"] as const

function asOneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
	return typeof value === "string" && allowed.includes(value as T) ? (value as T) : fallback
}

function renderSupportedBlock(block: Record<string, unknown>, key: string) {
	const blockType = asOptionalString(block.blockType)

	if (blockType === "button") {
		return renderButtonBlock(block, key)
	}

	if (blockType === "text") {
		const content = asOptionalString(block.content)
		if (!content) return null

		return (
			<Text
				key={key}
				as={asOneOf(block.as, textAs, "p")}
				size={asOneOf(block.size, textSizes, "base")}
				weight={asOneOf(block.weight, textWeights, "normal")}
				tone={asOneOf(block.tone, textTones, "default")}
				align={asOneOf(block.align, textAligns, "left")}
				className="whitespace-pre-wrap"
			>
				{content}
			</Text>
		)
	}

	return null
}

function renderCardContentBlock(block: Record<string, unknown>, key: string) {
	const blockType = asOptionalString(block.blockType)

	if (blockType === "text" || blockType === "button") {
		return renderSupportedBlock(block, key)
	}

	if (blockType === "markdown") {
		return <MarkdownNode key={key} block={block as MarkdownNodeProps["block"]} />
	}

	if (blockType === "handWriting") {
		return <HandWritingNode key={key} block={block as HandWritingNodeProps["block"]} />
	}

	if (blockType === "mediaImage") {
		return <MediaImageNode key={key} block={block as MediaImageNodeProps["block"]} />
	}

	if (blockType === "spotifyIframe") {
		return <SpotifyIframeNode key={key} block={block as SpotifyIframeNodeProps["block"]} />
	}

	if (blockType === "heatmap") {
		return <HeatmapNode key={key} block={block as HeatmapNodeProps["block"]} />
	}

	return null
}

export function CardNode({ block }: CardNodeProps) {
	const blockData = block as unknown as Record<string, unknown>

	const showHeader = asBooleanWithDefault(blockData.showHeader, true)
	const showContent = asBooleanWithDefault(blockData.showContent, true)
	const showFooter = asBooleanWithDefault(blockData.showFooter, false)

	const title = asOptionalString(blockData.title)
	const description = asOptionalString(blockData.description)

	const actionBlocks = asArray(blockData.actionBlocks)
	const contentBlocks = asArray(blockData.contentBlocks)
	const footerBlocks = asArray(blockData.footerBlocks)

	const actionNodes = actionBlocks
		.map((nestedBlock, index) => renderSupportedBlock(nestedBlock, `action-${index}`))
		.filter(Boolean)

	const contentNodes = contentBlocks
		.map((nestedBlock, index) => renderCardContentBlock(nestedBlock, `content-${index}`))
		.filter(Boolean)

	const footerNodes = footerBlocks
		.map((nestedBlock, index) => renderSupportedBlock(nestedBlock, `footer-${index}`))
		.filter(Boolean)

	const shouldRenderHeader = showHeader && Boolean(title || description || actionNodes.length > 0)
	const shouldRenderContent = showContent && contentNodes.length > 0
	const shouldRenderFooter = showFooter && footerNodes.length > 0

	return (
		<Card className="mx-auto w-full max-w-2xl">
			{shouldRenderHeader && (
				<CardHeader>
					{title && <CardTitle>{title}</CardTitle>}
					{description && <CardDescription>{description}</CardDescription>}
					{actionNodes.length > 0 && (
						<CardAction>
							<div className="flex flex-col items-end gap-2">{actionNodes}</div>
						</CardAction>
					)}
				</CardHeader>
			)}

			{shouldRenderContent && <CardContent>{contentNodes}</CardContent>}

			{shouldRenderFooter && (
				<CardFooter>
					<div className="flex w-full flex-wrap items-center gap-2">{footerNodes}</div>
				</CardFooter>
			)}
		</Card>
	)
}
