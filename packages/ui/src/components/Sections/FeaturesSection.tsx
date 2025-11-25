import * as React from "react"
import { cn } from "../../utils/classnames"
import * as LucideIcons from "lucide-react"

interface FeatureItem {
	icon?: string
	title: string
	description: string
}

export interface FeaturesSectionProps {
	title?: string
	subtitle?: string
	layout?: "grid" | "list"
	items: FeatureItem[]
	spacing?: {
		paddingTop?: "none" | "sm" | "md" | "lg"
		paddingBottom?: "none" | "sm" | "md" | "lg"
	}
}

export function FeaturesSection({
	title,
	subtitle,
	layout = "grid",
	items,
	spacing,
}: FeaturesSectionProps) {
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

	const getIcon = (iconName?: string): React.ReactNode => {
		if (!iconName) return null
		const iconsMap = LucideIcons as Record<string, unknown>
		const IconComponent = iconsMap[iconName]
		if (!IconComponent || typeof IconComponent !== "function") return null
		const Icon = IconComponent as React.ComponentType<{ className?: string }>
		return <Icon className="w-8 h-8" />
	}

	return (
		<section className={cn("py-16 md:py-24 bg-white dark:bg-gray-900", paddingClasses)}>
			<div className="container mx-auto px-4">
				{(title || subtitle) && (
					<div className="text-center mb-12 md:mb-16">
						{title && <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">{title}</h2>}
						{subtitle && (
							<p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
								{subtitle}
							</p>
						)}
					</div>
				)}

				<div
					className={cn(
						layout === "grid"
							? "grid md:grid-cols-2 lg:grid-cols-3 gap-8"
							: "flex flex-col gap-6 max-w-3xl mx-auto"
					)}
				>
					{items.map((item, index) => (
						<div
							key={index}
							className={cn(
								"p-6 rounded-xl border border-gray-200 dark:border-gray-700",
								"bg-gray-50 dark:bg-gray-800",
								"hover:shadow-lg transition-shadow duration-200"
							)}
						>
							{item.icon && (
								<div className="mb-4 text-blue-600 dark:text-blue-400">{getIcon(item.icon)}</div>
							)}
							<h3 className="text-xl font-semibold mb-2">{item.title}</h3>
							<p className="text-gray-600 dark:text-gray-400">{item.description}</p>
						</div>
					))}
				</div>
			</div>
		</section>
	)
}
