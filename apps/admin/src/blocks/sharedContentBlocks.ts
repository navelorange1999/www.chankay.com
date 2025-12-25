import type { BlockDefinition } from "./types"
import { ButtonBlock } from "./ButtonBlock"
import { CardBlock } from "./CardBlock"
import { HandWritingBlock } from "./HandWritingBlock"
import { HeatmapBlock } from "./HeatmapBlock"
import { MediaImageBlock } from "./MediaImageBlock"
import { TextBlock } from "./TextBlock"

export const sharedContentBlocks: BlockDefinition[] = [
	TextBlock,
	HandWritingBlock,
	HeatmapBlock,
	MediaImageBlock,
	CardBlock,
	ButtonBlock,
]
