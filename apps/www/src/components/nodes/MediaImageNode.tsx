import * as React from "react"

import { ImageMedia } from "@repo/ui"
import type { MediaInterface, Page } from "@repo/typescript-config/typings/payload-types"

type MediaImageBlock = Extract<NonNullable<Page["structure"]>[number], { blockType: "mediaImage" }>

export interface MediaImageNodeProps {
	block: MediaImageBlock
}

export function MediaImageNode({ block }: MediaImageNodeProps) {
	return (
		<div className="mx-auto w-full max-w-3xl">
			<ImageMedia
				pictureClassName="block relative w-full aspect-[16/9] overflow-hidden rounded-xl border"
				imgClassName="object-cover"
				fill
				resource={block.media as MediaInterface | string}
				priority
			/>
		</div>
	)
}
