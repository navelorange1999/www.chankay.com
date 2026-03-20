import { ImageMediaBase, type ImageMediaBaseProps } from "./ImageMediaBase"

export type ImageMediaProps = Omit<ImageMediaBaseProps, "onClick" | "onLoad" | "ref">

export function ImageMedia(props: ImageMediaProps) {
	return <ImageMediaBase {...props} />
}
