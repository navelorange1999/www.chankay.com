import * as React from "react"

import { cn } from "../../utils/classnames"
import { SkeletonBasic } from "./SkeletonBasic"

export interface SkeletonLinesProps extends React.ComponentProps<"div"> {
	lines?: number
	lineClassName?: string
}

export function SkeletonLines({
	lines = 3,
	className,
	lineClassName,
	...props
}: SkeletonLinesProps) {
	const safeLines = Math.max(0, Math.floor(lines))

	return (
		<div className={cn("flex flex-col gap-2", className)} {...props}>
			{Array.from({ length: safeLines }).map((_, index) => (
				<SkeletonBasic
					key={`skeleton-line-${index}`}
					className={cn(
						"h-3 w-full",
						index === safeLines - 1 && safeLines > 1 && "w-4/5",
						lineClassName
					)}
				/>
			))}
		</div>
	)
}
