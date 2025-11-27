import * as React from "react"
import { cn } from "../../utils/classnames"

interface Button {
	label: string
	href: string
	variant: "primary" | "secondary"
	external?: boolean
}

export interface HeroSectionProps {
	title: string
	subtitle?: string
	alignment?: "left" | "center" | "right"
	size?: "sm" | "md" | "lg"
	backgroundStyle?: "solid" | "gradient" | "none"
	buttons?: Button[]
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
	title,
	subtitle,
	alignment = "center",
	size = "md",
	backgroundStyle = "gradient",
	buttons = [],
	spacing,
	LinkComponent = "a",
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
				<h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
					{title}
				</h1>
				{subtitle && (
					<p className="text-lg md:text-xl lg:text-2xl text-muted-foreground mb-8 max-w-3xl">
						{subtitle}
					</p>
				)}
				{buttons.length > 0 && (
					<div className={cn("flex flex-wrap gap-4", alignment === "center" && "justify-center")}>
						{buttons.map((button, index) => {
							const buttonClasses = cn(
								"px-8 py-3 rounded-lg font-medium transition-all duration-200",
								button.variant === "primary"
									? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl"
									: "border-2 border-border hover:bg-secondary"
							)

							return button.external ? (
								<a
									key={index}
									href={button.href}
									target="_blank"
									rel="noopener noreferrer"
									className={buttonClasses}
								>
									{button.label}
								</a>
							) : (
								<LinkComponent key={index} href={button.href} className={buttonClasses}>
									{button.label}
								</LinkComponent>
							)
						})}
					</div>
				)}
			</div>
		</section>
	)
}
