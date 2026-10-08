import type { BlockDefinition } from "./types"
import { ButtonBlock } from "./ButtonBlock"
import { CardBlock } from "./CardBlock"
import { HandWritingBlock } from "./HandWritingBlock"
import { HeatmapBlock } from "./HeatmapBlock"
import { MarkdownBlock } from "./MarkdownBlock"
import { MediaImageBlock } from "./MediaImageBlock"
import { PreviewUrlBlock } from "./PreviewUrlBlock"
import { SpotifyIframeBlock } from "./SpotifyIframeBlock"
import { TextBlock } from "./TextBlock"
import { TopicMapBlock } from "./TopicMapBlock"

export const sharedContentBlocks: BlockDefinition[] = [
	TextBlock,
	MarkdownBlock,
	HandWritingBlock,
	HeatmapBlock,
	TopicMapBlock,
	MediaImageBlock,
	PreviewUrlBlock,
	CardBlock,
	ButtonBlock,
	SpotifyIframeBlock,
]
