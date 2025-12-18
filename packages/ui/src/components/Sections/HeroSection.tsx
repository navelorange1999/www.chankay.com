import * as React from "react"
import { cn } from "../../utils/classnames"

export interface HeroSectionProps {
	size?: "sm" | "md" | "lg"
	alignment?: "left" | "center" | "right"
	backgroundStyle?: "solid" | "gradient" | "none"
	children?: React.ReactNode
	spacing?: {
		paddingTop?: "none" | "sm" | "md" | "lg"
		paddingBottom?: "none" | "sm" | "md" | "lg"
	}
	LinkComponent?: React.ElementType<{ href: string; className?: string; children: React.ReactNode }>
}

const sizeMap = {
	sm: "py-12 md:py-16",
	md: "py-20 md:py-32",
	lg: "py-32 md:py-48",
}

const alignmentMap = {
	left: "text-left items-start",
	center: "text-center items-center",
	right: "text-right items-end",
}

const backgroundMap = {
	solid: "bg-background",
	gradient: "bg-gradient-to-br from-secondary via-muted to-accent",
	none: "bg-transparent",
}

export function HeroSection({
	alignment = "center",
	size = "md",
	backgroundStyle = "gradient",
	children,
	spacing,
}: HeroSectionProps) {
	const paddingClasses = [
		spacing?.paddingTop && spacing.paddingTop !== "none"
			? `pt-${spacing.paddingTop === "sm" ? "8" : spacing.paddingTop === "md" ? "16" : "24"}`
			: "",
		spacing?.paddingBottom && spacing.paddingBottom !== "none"
			? `pb-${spacing.paddingBottom === "sm" ? "8" : spacing.paddingBottom === "md" ? "16" : "24"}`
			: "",
	]
		.filter(Boolean)
		.join(" ")

	return (
		<section
			className={cn("relative", sizeMap[size], backgroundMap[backgroundStyle], paddingClasses)}
		>
			<div className={cn("container mx-auto px-4 flex flex-col", alignmentMap[alignment])}>
				{children && <div className="mb-8">{children}</div>}
			</div>
		</section>
	)
}
