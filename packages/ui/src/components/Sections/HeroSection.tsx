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
	gradient:
		"bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-950 dark:to-blue-950",
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
				<h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
					{title}
				</h1>
				{subtitle && (
					<p className="text-lg md:text-xl lg:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl">
						{subtitle}
					</p>
				)}
				{buttons.length > 0 && (
					<div className={cn("flex flex-wrap gap-4", alignment === "center" && "justify-center")}>
						{buttons.map((button, index) => {
							const buttonClasses = cn(
								"px-8 py-3 rounded-lg font-medium transition-all duration-200",
								button.variant === "primary"
									? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl"
									: "border-2 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
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
