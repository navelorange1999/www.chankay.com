import * as React from "react"

import { ImageMedia } from "@repo/ui/components/Media"
import type { MediaInterface, Page } from "@repo/typescript-config/typings/payload-types"

type PreviewUrlBlock = Extract<NonNullable<Page["structure"]>[number], { blockType: "previewUrl" }>

export interface PreviewUrlNodeProps {
	isPreview?: boolean
	block: PreviewUrlBlock
}

export function PreviewUrlNode({ block, isPreview = false }: PreviewUrlNodeProps) {
	if (
		!block.previewImage ||
		typeof block.previewImage !== "object" ||
		(!isPreview && block.previewImage._status !== "published")
	) {
		return null
	}

	return (
		<div className="mx-auto w-full max-w-3xl">
			<ImageMedia
				pictureClassName="block relative aspect-[16/9] w-full overflow-hidden rounded-xl border"
				imgClassName="object-cover"
				fill
				resource={block.previewImage as MediaInterface | string}
				priority
			/>
		</div>
	)
}
