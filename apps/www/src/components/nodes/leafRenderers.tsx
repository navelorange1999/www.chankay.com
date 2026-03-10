import * as React from "react"

import type { Page } from "@repo/typescript-config/typings/payload-types"

import { ButtonNode } from "@/components/nodes/ButtonNode"
import { CardNode } from "@/components/nodes/CardNode"
import { HandWritingNode } from "@/components/nodes/HandWritingNode"
import { HeatmapNode } from "@/components/nodes/HeatmapNode"
import { MarkdownNode } from "@/components/nodes/MarkdownNode"
import { MediaImageNode } from "@/components/nodes/MediaImageNode"
import { PreviewUrlNode, type PreviewUrlNodeProps } from "@/components/nodes/PreviewUrlNode"
import { SpotifyIframeNode } from "@/components/nodes/SpotifyIframeNode"
import { TextNode } from "@/components/nodes/TextNode"

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

export function isLeafBlockType(value: string): value is LeafBlockType {
	return (leafBlockTypes as readonly string[]).includes(value)
}

export function isLeafBlock(block: StructureBlock): block is LeafBlock {
	return isLeafBlockType(block.blockType)
}

type TextLeafBlock = Extract<LeafBlock, { blockType: "text" }>
type MarkdownLeafBlock = Extract<LeafBlock, { blockType: "markdown" }>
type HandWritingLeafBlock = Extract<LeafBlock, { blockType: "handWriting" }>
type MediaImageLeafBlock = Extract<LeafBlock, { blockType: "mediaImage" }>
type CardLeafBlock = Extract<LeafBlock, { blockType: "card" }>
type ButtonLeafBlock = Extract<LeafBlock, { blockType: "button" }>
type PreviewUrlLeafBlock = PreviewUrlNodeProps["block"]
type SpotifyIframeLeafBlock = Extract<LeafBlock, { blockType: "spotifyIframe" }>
type HeatmapLeafBlock = Extract<LeafBlock, { blockType: "heatmap" }>

type LeafRenderer = (block: LeafBlock, key: string) => React.ReactNode

const leafRenderers: Record<LeafBlockType, LeafRenderer> = {
	text: (block, key) => <TextNode key={key} block={block as TextLeafBlock} />,
	markdown: (block, key) => <MarkdownNode key={key} block={block as MarkdownLeafBlock} />,
	handWriting: (block, key) => <HandWritingNode key={key} block={block as HandWritingLeafBlock} />,
	mediaImage: (block, key) => <MediaImageNode key={key} block={block as MediaImageLeafBlock} />,
	card: (block, key) => <CardNode key={key} block={block as CardLeafBlock} />,
	button: (block, key) => <ButtonNode key={key} block={block as ButtonLeafBlock} />,
	previewUrl: (block, key) => <PreviewUrlNode key={key} block={block as PreviewUrlLeafBlock} />,
	spotifyIframe: (block, key) => (
		<SpotifyIframeNode key={key} block={block as SpotifyIframeLeafBlock} />
	),
	heatmap: (block, key) => <HeatmapNode key={key} block={block as HeatmapLeafBlock} />,
}

export function renderLeafBlock(block: LeafBlock, key: string) {
	return leafRenderers[block.blockType](block, key)
}
