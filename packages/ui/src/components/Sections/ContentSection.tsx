import { cn } from "../../utils/classnames"

export interface ContentSectionProps {
	title?: string
	body: string | Record<string, unknown>
	width?: "narrow" | "normal" | "wide" | "full"
	spacing?: {
		paddingTop?: "none" | "sm" | "md" | "lg"
		paddingBottom?: "none" | "sm" | "md" | "lg"
	}
}

const widthMap = {
	narrow: "max-w-2xl",
	normal: "max-w-4xl",
	wide: "max-w-6xl",
	full: "max-w-full",
}

export function ContentSection({ title, body, width = "normal", spacing }: ContentSectionProps) {
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
		<section className={cn("py-16 md:py-24", paddingClasses)}>
			<div className={cn("mx-auto px-4", widthMap[width])}>
				{title && <h2 className="text-3xl md:text-4xl font-bold mb-8">{title}</h2>}
				<div className="prose dark:prose-invert prose-lg max-w-none">
					{typeof body === "string" ? (
						<div dangerouslySetInnerHTML={{ __html: body }} />
					) : (
						<div>{JSON.stringify(body)}</div>
					)}
				</div>
			</div>
		</section>
	)
}
