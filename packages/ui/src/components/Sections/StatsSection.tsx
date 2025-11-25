import * as React from "react"
import { cn } from "../../utils/classnames"

interface StatItem {
	number: string
	label: string
}

export interface StatsSectionProps {
	items: StatItem[]
	spacing?: {
		paddingTop?: "none" | "sm" | "md" | "lg"
		paddingBottom?: "none" | "sm" | "md" | "lg"
	}
}

export function StatsSection({ items, spacing }: StatsSectionProps) {
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
		<section className={cn("py-16 md:py-24 bg-blue-600 dark:bg-blue-700", paddingClasses)}>
			<div className="container mx-auto px-4">
				<div
					className={cn(
						"grid gap-8",
						items.length === 2 && "md:grid-cols-2",
						items.length === 3 && "md:grid-cols-3",
						items.length === 4 && "md:grid-cols-4"
					)}
				>
					{items.map((item, index) => (
						<div key={index} className="text-center">
							<div className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-2">
								{item.number}
							</div>
							<div className="text-lg md:text-xl text-blue-100">{item.label}</div>
						</div>
					))}
				</div>
			</div>
		</section>
	)
}
