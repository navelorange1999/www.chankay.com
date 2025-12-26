import * as React from "react"

import { siBilibili, siGithub } from "simple-icons"

type SimpleIconData = {
	title: string
	hex: string
	path: string
}

const simpleIconRegistry = {
	github: siGithub,
	bilibili: siBilibili,
} satisfies Record<string, SimpleIconData>

export type SimpleIconName = keyof typeof simpleIconRegistry

export interface SimpleIconProps extends Omit<React.SVGProps<SVGSVGElement>, "children" | "color"> {
	name: SimpleIconName
	size?: number
	color?: "currentColor" | "brand"
	title?: string
}

export function SimpleIcon({
	name,
	size = 16,
	color = "currentColor",
	title,
	className,
	...props
}: SimpleIconProps) {
	const icon = simpleIconRegistry[name]
	const computedTitle = title ?? icon.title
	const fill = color === "brand" ? `#${icon.hex}` : "currentColor"

	return (
		<svg
			viewBox="0 0 24 24"
			width={size}
			height={size}
			fill={fill}
			aria-hidden={computedTitle ? undefined : true}
			role={computedTitle ? "img" : "presentation"}
			className={className}
			{...props}
		>
			{computedTitle ? <title>{computedTitle}</title> : null}
			<path d={icon.path} />
		</svg>
	)
}
