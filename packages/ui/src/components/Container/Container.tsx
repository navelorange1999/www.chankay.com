import * as React from "react"

import { cn } from "#utils/classnames"

export interface ContainerProps extends React.ComponentProps<"div"> {
	size?: "default" | "wide" | "full" | "reading"
}

export function Container({ size = "default", className, children, ...props }: ContainerProps) {
	return (
		<div
			className={cn(
				"mx-auto w-full min-w-0",
				"px-4 sm:px-6 lg:px-8",
				"[[data-slot=container]_&]:px-0",
				size === "default" && "max-w-7xl",
				size === "wide" && "max-w-screen-2xl",
				size === "full" && "max-w-none",
				size === "reading" && "max-w-3xl",
				className
			)}
			{...props}
			data-slot="container"
		>
			{children}
		</div>
	)
}
