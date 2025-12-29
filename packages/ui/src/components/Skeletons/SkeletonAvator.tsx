import * as React from "react"

import { cn } from "../../utils/classnames"
import { SkeletonBasic } from "./SkeletonBasic"

type SkeletonAvatorSize = "sm" | "md" | "lg" | "xl" | number

export interface SkeletonAvatorProps extends React.ComponentProps<"div"> {
	size?: SkeletonAvatorSize
}

function getSizeClassName(size: Exclude<SkeletonAvatorSize, number>) {
	switch (size) {
		case "sm":
			return "size-8"
		case "md":
			return "size-10"
		case "lg":
			return "size-12"
		case "xl":
			return "size-16"
	}
}

export function SkeletonAvator({ size = "md", className, style, ...props }: SkeletonAvatorProps) {
	const resolvedStyle =
		typeof size === "number"
			? ({ ...style, width: size, height: size } satisfies React.CSSProperties)
			: style

	return (
		<SkeletonBasic
			className={cn(
				"rounded-full",
				typeof size === "number" ? "shrink-0" : getSizeClassName(size),
				className
			)}
			style={resolvedStyle}
			{...props}
		/>
	)
}

export { SkeletonAvator as SkeletonAvatar }
