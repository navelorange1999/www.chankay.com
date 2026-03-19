"use client"

import * as React from "react"

import { cn } from "#utils/classnames"
import type { MarkdownHeading } from "../Markdown/markdownRenderer"

interface PostTocNavProps extends React.ComponentProps<"ul"> {
	headings: MarkdownHeading[]
}

const ACTIVE_HEADING_TOLERANCE = 12
const ACTIVE_HEADING_VIEWPORT_RATIO = 0.32

function resolveTocDepth(level: number, baseLevel: number): number {
	return Math.max(0, level - baseLevel)
}

function resolveTocItemClass(depth: number, previousDepth: number | null): string {
	if (depth <= 0) {
		if (previousDepth === null) return "mt-0"
		return "mt-1"
	}

	if (depth === 1) return "mt-1 ml-4"
	return "mt-0.5 ml-6"
}

function resolveTocLinkClass(depth: number): string {
	if (depth <= 0) {
		return "text-sm leading-6"
	}

	if (depth === 1) {
		return "text-[0.8125rem] leading-6 text-muted-foreground/80"
	}

	return "text-[0.8125rem] leading-6 text-muted-foreground/75"
}

function resolveTocActiveClass(depth: number): string {
	return depth <= 0 ? "font-semibold text-primary" : "font-medium text-primary"
}

function resolveNavbarOffset(): number {
	if (typeof window === "undefined") return 88

	const rootStyles = window.getComputedStyle(document.documentElement)
	const rawValue = rootStyles.getPropertyValue("--navbar-height").trim()

	if (rawValue.endsWith("rem")) {
		const remValue = Number.parseFloat(rawValue.slice(0, -3))
		if (Number.isFinite(remValue)) {
			const rootFontSize = Number.parseFloat(rootStyles.fontSize)
			return remValue * (Number.isFinite(rootFontSize) ? rootFontSize : 16) + 24
		}
	}

	if (rawValue.endsWith("px")) {
		const pxValue = Number.parseFloat(rawValue.slice(0, -2))
		if (Number.isFinite(pxValue)) {
			return pxValue + 24
		}
	}

	return 88
}

export function PostTocNav({ headings, className, ...props }: PostTocNavProps) {
	const [activeId, setActiveId] = React.useState(headings[0]?.id ?? "")

	const scrollToHeading = React.useCallback((headingId: string) => {
		if (typeof window === "undefined") return

		const element = document.getElementById(headingId)
		if (!element) return

		const top = window.scrollY + element.getBoundingClientRect().top - resolveNavbarOffset()

		window.scrollTo({
			top,
			behavior: "smooth",
		})

		window.history.replaceState(null, "", `#${headingId}`)
		setActiveId(headingId)
	}, [])

	const resolveActiveHeadingId = React.useCallback(() => {
		if (typeof window === "undefined" || headings.length === 0) {
			return headings[0]?.id ?? ""
		}

		const activationLine = Math.max(
			resolveNavbarOffset() + ACTIVE_HEADING_TOLERANCE,
			window.innerHeight * ACTIVE_HEADING_VIEWPORT_RATIO
		)
		let currentId = headings[0]?.id ?? ""

		for (const heading of headings) {
			const element = document.getElementById(heading.id)
			if (!element) continue

			if (element.getBoundingClientRect().top <= activationLine) {
				currentId = heading.id
			} else {
				break
			}
		}

		return currentId
	}, [headings])

	React.useEffect(() => {
		if (headings.length === 0) {
			return
		}

		let frameId = 0

		const updateActiveHeading = () => {
			frameId = 0
			setActiveId(resolveActiveHeadingId())
		}

		const requestUpdate = () => {
			if (frameId !== 0) return
			frameId = window.requestAnimationFrame(updateActiveHeading)
		}

		requestUpdate()
		window.addEventListener("scroll", requestUpdate, { passive: true })
		window.addEventListener("resize", requestUpdate)
		window.addEventListener("hashchange", requestUpdate)

		return () => {
			if (frameId !== 0) {
				window.cancelAnimationFrame(frameId)
			}
			window.removeEventListener("scroll", requestUpdate)
			window.removeEventListener("resize", requestUpdate)
			window.removeEventListener("hashchange", requestUpdate)
		}
	}, [headings, resolveActiveHeadingId])

	if (headings.length === 0) return null

	const baseLevel = Math.min(...headings.map((heading) => heading.level))

	return (
		<ul className={cn("space-y-0", className)} {...props}>
			{headings.map((heading, index) => {
				const isActive = heading.id === activeId
				const depth = resolveTocDepth(heading.level, baseLevel)
				const previousHeading = index > 0 ? headings[index - 1] : null
				const previousDepth = previousHeading
					? resolveTocDepth(previousHeading.level, baseLevel)
					: null

				return (
					<li key={heading.id} className={resolveTocItemClass(depth, previousDepth)}>
						<a
							href={`#${heading.id}`}
							aria-current={isActive ? "location" : undefined}
							className={cn(
								"block truncate whitespace-nowrap tracking-[-0.01em] text-muted-foreground transition-colors hover:text-foreground",
								resolveTocLinkClass(depth),
								isActive && resolveTocActiveClass(depth)
							)}
							onClick={(event) => {
								event.preventDefault()
								scrollToHeading(heading.id)
							}}
						>
							{heading.text}
						</a>
					</li>
				)
			})}
		</ul>
	)
}
