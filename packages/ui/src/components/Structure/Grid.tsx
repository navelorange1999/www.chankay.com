import * as React from "react"

import { cn } from "#utils/classnames"

type GridColumns = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12

export interface GridProps extends React.ComponentPropsWithoutRef<"div"> {
	as?: "div" | "section" | "main" | "article" | "header" | "footer" | "nav" | "aside"
	columns?: GridColumns
	columnsSm?: GridColumns
	columnsMd?: GridColumns
	columnsLg?: GridColumns
	gap?: "none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl"
	alignItems?: "start" | "center" | "end" | "stretch" | "baseline"
	justifyItems?: "start" | "center" | "end" | "stretch"
}

const columnsMap: Record<GridColumns, string> = {
	1: "grid-cols-1",
	2: "grid-cols-2",
	3: "grid-cols-3",
	4: "grid-cols-4",
	5: "grid-cols-5",
	6: "grid-cols-6",
	7: "grid-cols-7",
	8: "grid-cols-8",
	9: "grid-cols-9",
	10: "grid-cols-10",
	11: "grid-cols-11",
	12: "grid-cols-12",
}

const columnsSmMap: Record<GridColumns, string> = {
	1: "sm:grid-cols-1",
	2: "sm:grid-cols-2",
	3: "sm:grid-cols-3",
	4: "sm:grid-cols-4",
	5: "sm:grid-cols-5",
	6: "sm:grid-cols-6",
	7: "sm:grid-cols-7",
	8: "sm:grid-cols-8",
	9: "sm:grid-cols-9",
	10: "sm:grid-cols-10",
	11: "sm:grid-cols-11",
	12: "sm:grid-cols-12",
}

const columnsMdMap: Record<GridColumns, string> = {
	1: "md:grid-cols-1",
	2: "md:grid-cols-2",
	3: "md:grid-cols-3",
	4: "md:grid-cols-4",
	5: "md:grid-cols-5",
	6: "md:grid-cols-6",
	7: "md:grid-cols-7",
	8: "md:grid-cols-8",
	9: "md:grid-cols-9",
	10: "md:grid-cols-10",
	11: "md:grid-cols-11",
	12: "md:grid-cols-12",
}

const columnsLgMap: Record<GridColumns, string> = {
	1: "lg:grid-cols-1",
	2: "lg:grid-cols-2",
	3: "lg:grid-cols-3",
	4: "lg:grid-cols-4",
	5: "lg:grid-cols-5",
	6: "lg:grid-cols-6",
	7: "lg:grid-cols-7",
	8: "lg:grid-cols-8",
	9: "lg:grid-cols-9",
	10: "lg:grid-cols-10",
	11: "lg:grid-cols-11",
	12: "lg:grid-cols-12",
}

const gapMap: Record<NonNullable<GridProps["gap"]>, string> = {
	none: "gap-0",
	xs: "gap-2",
	sm: "gap-4",
	md: "gap-6",
	lg: "gap-8",
	xl: "gap-10",
	"2xl": "gap-12",
}

const alignItemsMap: Record<NonNullable<GridProps["alignItems"]>, string> = {
	start: "items-start",
	center: "items-center",
	end: "items-end",
	stretch: "items-stretch",
	baseline: "items-baseline",
}

const justifyItemsMap: Record<NonNullable<GridProps["justifyItems"]>, string> = {
	start: "justify-items-start",
	center: "justify-items-center",
	end: "justify-items-end",
	stretch: "justify-items-stretch",
}

export function Grid({
	as = "div",
	columns = 1,
	columnsSm,
	columnsMd,
	columnsLg,
	gap = "none",
	alignItems = "stretch",
	justifyItems = "stretch",
	className,
	...props
}: GridProps) {
	const Comp = as

	return (
		<Comp
			className={cn(
				"grid",
				columnsMap[columns],
				columnsSm ? columnsSmMap[columnsSm] : null,
				columnsMd ? columnsMdMap[columnsMd] : null,
				columnsLg ? columnsLgMap[columnsLg] : null,
				gapMap[gap],
				alignItemsMap[alignItems],
				justifyItemsMap[justifyItems],
				className
			)}
			{...props}
		/>
	)
}
