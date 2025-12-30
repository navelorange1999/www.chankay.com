import * as React from "react"

import { cn } from "#utils/classnames"

export interface TextProps extends React.ComponentPropsWithoutRef<"p"> {
	as?: "p" | "span" | "div" | "h1" | "h2" | "h3" | "h4"
	size?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl"
	weight?: "normal" | "medium" | "semibold" | "bold"
	tone?: "default" | "muted" | "primary" | "accent"
	align?: "left" | "center" | "right"
}

const sizeMap: Record<NonNullable<TextProps["size"]>, string> = {
	xs: "text-xs",
	sm: "text-sm",
	base: "text-base",
	lg: "text-lg",
	xl: "text-xl",
	"2xl": "text-2xl",
}

const weightMap: Record<NonNullable<TextProps["weight"]>, string> = {
	normal: "font-normal",
	medium: "font-medium",
	semibold: "font-semibold",
	bold: "font-bold",
}

const toneMap: Record<NonNullable<TextProps["tone"]>, string> = {
	default: "text-foreground",
	muted: "text-muted-foreground",
	primary: "text-primary",
	accent: "text-accent",
}

const alignMap: Record<NonNullable<TextProps["align"]>, string> = {
	left: "text-left",
	center: "text-center",
	right: "text-right",
}

export function Text({
	as = "p",
	size = "base",
	weight = "normal",
	tone = "default",
	align = "left",
	className,
	...props
}: TextProps) {
	const Comp = as

	return (
		<Comp
			className={cn(sizeMap[size], weightMap[weight], toneMap[tone], alignMap[align], className)}
			{...props}
		/>
	)
}
