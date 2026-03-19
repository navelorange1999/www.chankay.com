import * as React from "react"

import { cn } from "#utils/classnames"
import { MermaidHydrator } from "./MermaidHydrator"
import { createMarkdownDocument, hasMermaidDiagrams } from "./markdownRenderer"

export interface MarkdownProps extends Omit<React.ComponentPropsWithoutRef<"div">, "children"> {
	content: string
	html?: string
}

export function Markdown({ content, html, className, id, ...props }: MarkdownProps) {
	const hasContent = content.trim().length > 0
	const generatedId = React.useId().replace(/[^a-zA-Z0-9_-]/g, "")
	const containerId = id ?? `markdown-${generatedId}`

	const renderedHtml = html ?? (hasContent ? createMarkdownDocument(content).html : "")
	const hasMermaid = hasMermaidDiagrams(renderedHtml)

	if (!hasContent) return null

	return (
		<div
			id={containerId}
			className={cn(
				"prose max-w-none text-foreground",
				"prose-headings:font-semibold prose-headings:text-foreground",
				"prose-headings:scroll-mt-24",
				"prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground",
				"prose-a:text-primary hover:prose-a:text-primary/80",
				"prose-code:text-foreground prose-code:before:content-none prose-code:after:content-none",
				"prose-pre:overflow-hidden prose-pre:border prose-pre:border-border prose-pre:bg-transparent prose-pre:p-0 prose-pre:text-inherit",
				"prose-blockquote:border-primary/30 prose-blockquote:text-muted-foreground",
				"prose-hr:border-border prose-img:rounded-lg",
				className
			)}
			{...props}
		>
			<div dangerouslySetInnerHTML={{ __html: renderedHtml }} />
			{hasMermaid ? <MermaidHydrator containerId={containerId} /> : null}
		</div>
	)
}
