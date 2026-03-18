import { ImageMediaBase, type ImageMediaBaseProps } from "./ImageMediaBase"

export interface ImageMediaProps extends Omit<ImageMediaBaseProps, "onClick" | "onLoad" | "ref"> {}

export function ImageMedia(props: ImageMediaProps) {
	return <ImageMediaBase {...props} />
}
