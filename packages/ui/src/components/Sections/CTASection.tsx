import * as React from "react"
import { cn } from "../../utils/classnames"

export interface CTASectionProps {
	title: string
	description?: string
	buttonLabel: string
	buttonHref: string
	style?: "primary" | "accent"
	spacing?: {
		paddingTop?: "none" | "sm" | "md" | "lg"
		paddingBottom?: "none" | "sm" | "md" | "lg"
	}
	LinkComponent?: React.ElementType<{ href: string; className?: string; children: React.ReactNode }>
}

const styleMap = {
	primary: {
		background: "bg-primary",
		button: "bg-primary-foreground text-primary hover:bg-secondary hover:text-accent-foreground",
	},
	accent: {
		background: "bg-accent",
		button: "bg-accent-foreground text-accent hover:bg-secondary hover:text-primary",
	},
}

export function CTASection({
	title,
	description,
	buttonLabel,
	buttonHref,
	style = "primary",
	spacing,
	LinkComponent = "a",
}: CTASectionProps) {
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
			className={cn(
				"py-16 md:py-24 text-primary-foreground",
				styleMap[style].background,
				paddingClasses
			)}
		>
			<div className="container mx-auto px-4 text-center">
				<h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">{title}</h2>
				{description && (
					<p className="text-lg md:text-xl mb-8 opacity-90 max-w-3xl mx-auto">{description}</p>
				)}
				<LinkComponent
					href={buttonHref}
					className={cn(
						"inline-block px-8 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl",
						styleMap[style].button
					)}
				>
					{buttonLabel}
				</LinkComponent>
			</div>
		</section>
	)
}
