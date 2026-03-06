import * as React from "react"
import hljs from "highlight.js/lib/common"
import { marked } from "marked"

import { cn } from "#utils/classnames"

export interface MarkdownProps extends Omit<React.ComponentPropsWithoutRef<"div">, "children"> {
	content: string
}

const renderer = new marked.Renderer()

renderer.code = ({ text, lang }) => {
	const language = typeof lang === "string" ? lang.trim().toLowerCase() : ""
	const result =
		language && hljs.getLanguage(language)
			? hljs.highlight(text, { language, ignoreIllegals: true })
			: hljs.highlightAuto(text)

	const languageClass = result.language ? ` language-${result.language}` : ""

	return `<pre><code class="hljs${languageClass}">${result.value}</code></pre>`
}

export function Markdown({ content, className, ...props }: MarkdownProps) {
	if (!content.trim()) return null

	const html = marked.parse(content, {
		async: false,
		gfm: true,
		breaks: false,
		renderer,
	}) as string

	return (
		<div
			className={cn(
				"prose max-w-none text-foreground",
				"prose-headings:font-semibold prose-headings:text-foreground",
				"prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground",
				"prose-a:text-primary hover:prose-a:text-primary/80",
				"prose-code:text-foreground prose-code:before:content-none prose-code:after:content-none",
				"prose-pre:overflow-hidden prose-pre:border prose-pre:border-border prose-pre:bg-transparent prose-pre:p-0 prose-pre:text-inherit",
				"prose-blockquote:border-primary/30 prose-blockquote:text-muted-foreground",
				"prose-hr:border-border prose-img:rounded-lg",
				className
			)}
			dangerouslySetInnerHTML={{ __html: html }}
			{...props}
		/>
	)
}
