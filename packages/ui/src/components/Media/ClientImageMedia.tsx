"use client"

import { ImageMediaBase, type ImageMediaBaseProps } from "./ImageMediaBase"

export type ClientImageMediaProps = ImageMediaBaseProps

export function ClientImageMedia(props: ClientImageMediaProps) {
	return <ImageMediaBase {...props} />
}
