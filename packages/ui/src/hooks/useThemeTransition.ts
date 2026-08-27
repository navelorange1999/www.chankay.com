"use client"

import { useCallback } from "react"

import type { ThemeMode } from "./useTheme"

type ViewTransitionHandle = {
	finished: Promise<void>
	ready: Promise<void>
}

type DocumentWithViewTransition = Document & {
	startViewTransition?: (callback: () => void) => ViewTransitionHandle
}

interface UseThemeTransitionOptions {
	resolvedTheme: "light" | "dark"
	setTheme: (theme: ThemeMode) => void
}

interface ThemeTransitionApi {
	getBinaryNextTheme: () => Exclude<ThemeMode, "system">
	runThemeTransition: (nextTheme: ThemeMode, triggerElement: HTMLElement) => void
}

interface ThemeTransitionViewport {
	height: number
	width: number
}

export function resolveThemeTransitionGeometry(
	triggerRect: Pick<DOMRect, "height" | "left" | "top" | "width">,
	viewport: ThemeTransitionViewport
) {
	const originX = triggerRect.left + triggerRect.width / 2
	const originY = triggerRect.top + triggerRect.height / 2
	const horizontalRadius = Math.max(originX, viewport.width - originX)
	const verticalRadius = Math.max(originY, viewport.height - originY)

	return {
		originX,
		originY,
		radius: Math.hypot(horizontalRadius, verticalRadius),
	}
}

export function useThemeTransition({
	resolvedTheme,
	setTheme,
}: UseThemeTransitionOptions): ThemeTransitionApi {
	const getBinaryNextTheme = useCallback((): Exclude<ThemeMode, "system"> => {
		return resolvedTheme === "dark" ? "light" : "dark"
	}, [resolvedTheme])

	const runThemeTransition = useCallback(
		(nextTheme: ThemeMode, triggerElement: HTMLElement) => {
			if (typeof document === "undefined" || typeof window === "undefined") {
				setTheme(nextTheme)
				return
			}

			const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
			const transitioningDocument = document as DocumentWithViewTransition
			if (!transitioningDocument.startViewTransition || reducedMotion) {
				setTheme(nextTheme)
				return
			}

			const { originX, originY, radius } = resolveThemeTransitionGeometry(
				triggerElement.getBoundingClientRect(),
				{
					height: window.innerHeight,
					width: window.innerWidth,
				}
			)

			const rootElement = document.documentElement
			rootElement.setAttribute("data-theme-transition", "radial")

			let cleaned = false
			const cleanup = () => {
				if (cleaned) {
					return
				}

				cleaned = true
				rootElement.removeAttribute("data-theme-transition")
			}

			const cleanupTimeout = window.setTimeout(cleanup, 2000)
			const transition = transitioningDocument.startViewTransition(() => {
				setTheme(nextTheme)
			})

			transition.ready
				.then(() => {
					rootElement.animate(
						{
							clipPath: [
								`circle(0px at ${originX}px ${originY}px)`,
								`circle(${radius}px at ${originX}px ${originY}px)`,
							],
						},
						{
							duration: 1200,
							easing: "cubic-bezier(0.22, 1, 0.36, 1)",
							fill: "both",
							pseudoElement: "::view-transition-new(root)",
						}
					)
				})
				.catch(() => undefined)

			transition.finished
				.catch(() => undefined)
				.finally(() => {
					window.clearTimeout(cleanupTimeout)
					cleanup()
				})
		},
		[setTheme]
	)

	return {
		getBinaryNextTheme,
		runThemeTransition,
	}
}
