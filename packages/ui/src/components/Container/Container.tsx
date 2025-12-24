import * as React from "react"

import { cn } from "../../utils/classnames"

export interface ContainerProps extends React.ComponentProps<"div"> {
	size?: "default" | "wide" | "full"
}

export function Container({ size = "default", className, children, ...props }: ContainerProps) {
	return (
		<div
			className={cn(
				"mx-auto w-full",
				"px-4 sm:px-6 lg:px-8",
				size === "default" && "max-w-7xl",
				size === "wide" && "max-w-screen-2xl",
				size === "full" && "max-w-none",
				className
			)}
			{...props}
		>
			{children}
		</div>
	)
}
