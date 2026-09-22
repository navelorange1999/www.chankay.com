import type { ReactNode } from "react"

export function PostCommentsSection({
	title,
	description,
	discussionsUrl,
	linkLabel,
	children,
}: {
	title: string
	description: string
	discussionsUrl: string
	linkLabel: string
	children: ReactNode
}) {
	return (
		<section
			id="comments"
			aria-labelledby="post-comments-title"
			className="mt-12 min-w-0 space-y-4 border-t border-border pt-8"
		>
			<h2 id="post-comments-title" className="text-2xl font-semibold tracking-tight">
				{title}
			</h2>
			<p className="text-sm text-muted-foreground">{description}</p>
			<a
				href={discussionsUrl}
				target="_blank"
				rel="noopener noreferrer"
				className="inline-block text-sm underline underline-offset-4"
			>
				{linkLabel}
			</a>
			{children}
		</section>
	)
}
