import { ImageMedia } from "@repo/ui/components/Media"
import type { MediaInterface, Page } from "@repo/typescript-config/typings/payload-types"

type PreviewUrlBlock = Extract<NonNullable<Page["structure"]>[number], { blockType: "previewUrl" }>

export interface PreviewUrlNodeProps {
	block: PreviewUrlBlock
}

export function PreviewUrlNode({ block }: PreviewUrlNodeProps) {
	if (!block.previewImage) {
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
