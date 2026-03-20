import * as React from "react"
import { List } from "lucide-react"

import { cn } from "#utils/classnames"
import { Markdown, type MarkdownProps } from "../Markdown"
import type { MarkdownHeading } from "../Markdown/markdownRenderer"
import { PostTocNav } from "./PostTocNav"

function Post({ className, ...props }: React.ComponentProps<"article">) {
	return (
		<article
			data-slot="post"
			className={cn(
				"bg-card text-card-foreground flex flex-col gap-4 rounded-xl border shadow-sm",
				className
			)}
			{...props}
		/>
	)
}

function PostHeader({ className, ...props }: React.ComponentProps<"header">) {
	return (
		<header data-slot="post-header" className={cn("flex flex-col gap-2", className)} {...props} />
	)
}

function PostThumbnail({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="post-thumbnail"
			className={cn("relative aspect-video w-full overflow-hidden rounded-t-xl", className)}
			{...props}
		/>
	)
}

function PostTitle({ className, ...props }: React.ComponentProps<"h2">) {
	return (
		<h2
			data-slot="post-title"
			className={cn("text-2xl font-bold leading-tight tracking-tight md:text-3xl", className)}
			{...props}
		/>
	)
}

function PostMeta({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="post-meta"
			className={cn("flex flex-wrap items-center gap-2 text-sm text-muted-foreground", className)}
			{...props}
		/>
	)
}

// A special component for inline meta with tags (responsive)
function PostMetaInline({ className, children, ...props }: React.ComponentProps<"div">) {
	// Separate tags from other meta items
	const childArray = React.Children.toArray(children)
	const tags: React.ReactNode[] = []
	const metaItems: React.ReactNode[] = []

	childArray.forEach((child) => {
		if (React.isValidElement(child) && child.type === PostTag) {
			tags.push(child)
		} else {
			metaItems.push(child)
		}
	})

	return (
		<div
			data-slot="post-meta-inline"
			className={cn("text-sm text-muted-foreground", className)}
			{...props}
		>
			{/* Desktop: all inline, Mobile: tags on separate line */}
			<div className="sm:flex sm:flex-wrap sm:items-center sm:gap-2">
				{/* Meta items */}
				<div className="flex flex-wrap items-center gap-2">{metaItems}</div>
				{/* Tags - hidden on mobile, shown inline on desktop */}
				{tags.length > 0 && <div className="hidden sm:flex sm:items-center sm:gap-1">{tags}</div>}
			</div>
			{/* Mobile only: Tags below */}
			{tags.length > 0 && <div className="flex sm:hidden flex-wrap gap-1 mt-2">{tags}</div>}
		</div>
	)
}

// Separator for meta items
function PostMetaSeparator({ className, ...props }: React.ComponentProps<"span">) {
	return (
		<span className={cn("hidden sm:inline", className)} {...props}>
			•
		</span>
	)
}

function PostDate({ className, ...props }: React.ComponentProps<"time">) {
	return <time data-slot="post-date" className={cn("", className)} {...props} />
}

function PostReadingTime({ className, ...props }: React.ComponentProps<"span">) {
	return <span data-slot="post-reading-time" className={cn("", className)} {...props} />
}

interface PostTocProps extends React.ComponentProps<"nav"> {
	headings: MarkdownHeading[]
	showTitle?: boolean
	title?: string
}

function PostToc({
	headings,
	showTitle = true,
	title = "On this page",
	className,
	...props
}: PostTocProps) {
	if (headings.length === 0) return null

	return (
		<nav data-slot="post-toc" className={cn("space-y-3", className)} {...props}>
			{showTitle ? (
				<div className="flex items-center gap-2">
					<List className="h-4 w-4 text-muted-foreground" />
					<p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
						{title}
					</p>
				</div>
			) : null}

			<PostTocNav headings={headings} />
		</nav>
	)
}

interface PostTocLayoutProps extends React.ComponentProps<"div"> {
	children: React.ReactNode
	headings: MarkdownHeading[]
	startAside?: React.ReactNode
	title?: string
}

function PostTocLayout({
	children,
	headings,
	startAside,
	title = "On this page",
	className,
	...props
}: PostTocLayoutProps) {
	const hasStartAside = Boolean(startAside)
	const hasToc = headings.length > 0

	return (
		<div data-slot="post-toc-layout" className={cn("relative", className)} {...props}>
			<div
				className={cn(
					"min-w-0",
					hasStartAside &&
						hasToc &&
						"lg:grid lg:grid-cols-[3rem_minmax(0,1fr)_16rem] lg:items-start lg:gap-8 xl:gap-10",
					hasStartAside &&
						!hasToc &&
						"lg:grid lg:grid-cols-[3rem_minmax(0,1fr)] lg:items-start lg:gap-8",
					!hasStartAside &&
						hasToc &&
						"lg:grid lg:grid-cols-[minmax(0,1fr)_16rem] lg:items-start lg:gap-8"
				)}
			>
				{hasStartAside ? (
					<aside
						data-slot="post-start-aside"
						className="hidden lg:flex lg:self-start lg:sticky lg:top-[calc(var(--navbar-height,4rem)+1.5rem)]"
					>
						{startAside}
					</aside>
				) : null}

				<div className="min-w-0">{children}</div>

				{hasToc ? (
					<aside
						data-slot="post-toc-desktop"
						className="hidden lg:block lg:self-start lg:sticky lg:top-[calc(var(--navbar-height,4rem)+1.5rem)]"
					>
						<div className="rounded-xl border border-border bg-card/40 p-4">
							<PostToc headings={headings} title={title} />
						</div>
					</aside>
				) : null}
			</div>
		</div>
	)
}

interface PostExcerptProps extends Omit<MarkdownProps, "content"> {
	children?: React.ReactNode
	content?: string
	asMarkdown?: boolean
}

function PostExcerpt({
	className,
	children,
	content,
	asMarkdown = false,
	...props
}: PostExcerptProps) {
	if (asMarkdown && content) {
		return (
			<div data-slot="post-excerpt">
				<Markdown
					content={content}
					className={cn(
						"prose-sm max-w-none text-muted-foreground",
						"prose-p:my-0 prose-p:text-muted-foreground",
						"prose-headings:my-0 prose-headings:text-foreground",
						"prose-strong:text-foreground prose-li:text-muted-foreground",
						"prose-ul:my-2 prose-ol:my-2",
						className
					)}
					{...props}
				/>
			</div>
		)
	}

	return (
		<p
			data-slot="post-excerpt"
			className={cn("text-muted-foreground line-clamp-3", className)}
			{...props}
		>
			{children ?? content}
		</p>
	)
}

interface PostContentProps extends Omit<MarkdownProps, "content"> {
	children?: React.ReactNode
	content?: string
	asMarkdown?: boolean
}

function PostContent({
	className,
	children,
	content,
	asMarkdown = false,
	...props
}: PostContentProps) {
	if (asMarkdown && content) {
		return (
			<div data-slot="post-content" className={cn("px-6 py-3", className)}>
				<Markdown content={content} {...props} />
			</div>
		)
	}

	return (
		<div
			data-slot="post-content"
			className={cn("prose prose-neutral dark:prose-invert max-w-none px-6 py-3", className)}
			{...props}
		>
			{children}
		</div>
	)
}

function PostFooter({ className, ...props }: React.ComponentProps<"footer">) {
	return (
		<footer
			data-slot="post-footer"
			className={cn("flex items-center gap-4 border-t px-6 pt-4", className)}
			{...props}
		/>
	)
}

function PostTags({ className, ...props }: React.ComponentProps<"div">) {
	return <div data-slot="post-tags" className={cn("flex flex-wrap gap-2", className)} {...props} />
}

interface PostTagProps extends React.ComponentProps<"span"> {
	variant?: "default" | "primary" | "outline"
	size?: "sm" | "md"
}

function PostTag({ className, variant = "default", size = "sm", ...props }: PostTagProps) {
	const variants = {
		default: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
		primary: "bg-primary text-primary-foreground hover:bg-primary/90",
		outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
	}

	const sizes = {
		sm: "px-2.5 py-0.5 text-xs",
		md: "px-3 py-1 text-sm",
	}

	return (
		<span
			data-slot="post-tag"
			className={cn(
				"inline-flex items-center rounded-full font-medium transition-colors cursor-pointer",
				variants[variant],
				sizes[size],
				className
			)}
			{...props}
		/>
	)
}

export {
	Post,
	PostHeader,
	PostThumbnail,
	PostTitle,
	PostMeta,
	PostMetaInline,
	PostMetaSeparator,
	PostDate,
	PostReadingTime,
	PostToc,
	PostTocLayout,
	PostExcerpt,
	PostContent,
	PostFooter,
	PostTags,
	PostTag,
}
