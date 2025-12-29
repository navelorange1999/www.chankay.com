import * as React from "react"

import { cn } from "../../utils/classnames"
import { SkeletonBasic } from "./SkeletonBasic"

type SkeletonMediaAspect = "square" | "video" | "portrait" | "wide"

export interface SkeletonMediaProps extends React.ComponentProps<"div"> {
	aspect?: SkeletonMediaAspect
}

function getAspectClassName(aspect: SkeletonMediaAspect) {
	switch (aspect) {
		case "square":
			return "aspect-square"
		case "portrait":
			return "aspect-[3/4]"
		case "wide":
			return "aspect-[21/9]"
		case "video":
			return "aspect-video"
	}
}

export function SkeletonMedia({ aspect = "video", className, ...props }: SkeletonMediaProps) {
	return (
		<SkeletonBasic className={cn("w-full", getAspectClassName(aspect), className)} {...props} />
	)
}
