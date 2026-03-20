import * as React from "react"
import { cache } from "react"

import type { Page } from "@repo/typescript-config/typings/payload-types"

type StructureBlocks = NonNullable<Page["structure"]>
type StructureBlock = StructureBlocks[number]

export const leafBlockTypes = [
	"text",
	"markdown",
	"handWriting",
	"mediaImage",
	"card",
	"button",
	"previewUrl",
	"spotifyIframe",
	"heatmap",
] as const

export type LeafBlockType = (typeof leafBlockTypes)[number]
export type LeafBlock = Extract<StructureBlock, { blockType: LeafBlockType }>
type LeafRendererComponent = (props: {
	block: LeafBlock
}) => React.ReactNode | Promise<React.ReactNode>

export function isLeafBlockType(value: string): value is LeafBlockType {
	return (leafBlockTypes as readonly string[]).includes(value)
}

export function isLeafBlock(block: StructureBlock): block is LeafBlock {
	return isLeafBlockType(block.blockType)
}

const loadLeafRenderer = cache(async (blockType: LeafBlockType): Promise<LeafRendererComponent> => {
	switch (blockType) {
		case "text": {
			const { TextNode } = await import("@/components/nodes/TextNode")
			return TextNode as LeafRendererComponent
		}
		case "markdown": {
			const { MarkdownNode } = await import("@/components/nodes/MarkdownNode")
			return MarkdownNode as LeafRendererComponent
		}
		case "handWriting": {
			const { HandWritingNode } = await import("@/components/nodes/HandWritingNode")
			return HandWritingNode as LeafRendererComponent
		}
		case "mediaImage": {
			const { MediaImageNode } = await import("@/components/nodes/MediaImageNode")
			return MediaImageNode as LeafRendererComponent
		}
		case "card": {
			const { CardNode } = await import("@/components/nodes/CardNode")
			return CardNode as LeafRendererComponent
		}
		case "button": {
			const { ButtonNode } = await import("@/components/nodes/ButtonNode")
			return ButtonNode as LeafRendererComponent
		}
		case "previewUrl": {
			const { PreviewUrlNode } = await import("@/components/nodes/PreviewUrlNode")
			return PreviewUrlNode as LeafRendererComponent
		}
		case "spotifyIframe": {
			const { SpotifyIframeNode } = await import("@/components/nodes/SpotifyIframeNode")
			return SpotifyIframeNode as LeafRendererComponent
		}
		case "heatmap": {
			const { HeatmapNode } = await import("@/components/nodes/HeatmapNode")
			return HeatmapNode as LeafRendererComponent
		}
	}
})

export async function renderLeafBlock(block: LeafBlock, key: string) {
	const Renderer = await loadLeafRenderer(block.blockType)

	return <Renderer key={key} block={block} />
}
