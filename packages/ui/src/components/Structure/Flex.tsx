import * as React from "react"

import { cn } from "../../utils/classnames"

export interface FlexProps extends React.ComponentPropsWithoutRef<"div"> {
	as?: "div" | "section" | "main" | "article" | "header" | "footer" | "nav" | "aside"
	inline?: boolean
	direction?: "row" | "rowReverse" | "col" | "colReverse"
	wrap?: "nowrap" | "wrap" | "wrapReverse"
	align?: "start" | "center" | "end" | "stretch" | "baseline"
	justify?: "start" | "center" | "end" | "between" | "around" | "evenly"
	gap?: "none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl"
}

const directionMap: Record<NonNullable<FlexProps["direction"]>, string> = {
	row: "flex-row",
	rowReverse: "flex-row-reverse",
	col: "flex-col",
	colReverse: "flex-col-reverse",
}

const wrapMap: Record<NonNullable<FlexProps["wrap"]>, string> = {
	nowrap: "flex-nowrap",
	wrap: "flex-wrap",
	wrapReverse: "flex-wrap-reverse",
}

const alignMap: Record<NonNullable<FlexProps["align"]>, string> = {
	start: "items-start",
	center: "items-center",
	end: "items-end",
	stretch: "items-stretch",
	baseline: "items-baseline",
}

const justifyMap: Record<NonNullable<FlexProps["justify"]>, string> = {
	start: "justify-start",
	center: "justify-center",
	end: "justify-end",
	between: "justify-between",
	around: "justify-around",
	evenly: "justify-evenly",
}

const gapMap: Record<NonNullable<FlexProps["gap"]>, string> = {
	none: "gap-0",
	xs: "gap-2",
	sm: "gap-4",
	md: "gap-6",
	lg: "gap-8",
	xl: "gap-10",
	"2xl": "gap-12",
}

export function Flex({
	as = "div",
	inline = false,
	direction = "row",
	wrap = "nowrap",
	align = "stretch",
	justify = "start",
	gap = "none",
	className,
	...props
}: FlexProps) {
	const Comp = as

	return (
		<Comp
			className={cn(
				inline ? "inline-flex" : "flex",
				directionMap[direction],
				wrapMap[wrap],
				alignMap[align],
				justifyMap[justify],
				gapMap[gap],
				className
			)}
			{...props}
		/>
	)
}
