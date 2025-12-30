import * as React from "react"

import { cn } from "#utils/classnames"

export type SkeletonBasicProps = React.ComponentProps<"div">

export function SkeletonBasic({ className, ...props }: SkeletonBasicProps) {
	return (
		<div
			data-slot="skeleton"
			className={cn("animate-pulse rounded-md bg-accent", className)}
			{...props}
		/>
	)
}
