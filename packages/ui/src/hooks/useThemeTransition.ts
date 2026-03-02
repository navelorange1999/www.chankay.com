"use client"

import { useCallback } from "react"
import type { MouseEvent } from "react"

import type { ThemeMode } from "./useTheme"

type ViewTransitionHandle = {
	finished: Promise<void>
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
	runThemeTransition: (nextTheme: ThemeMode, event: MouseEvent<HTMLElement>) => void
}

export function useThemeTransition({
	resolvedTheme,
	setTheme,
}: UseThemeTransitionOptions): ThemeTransitionApi {
	const getBinaryNextTheme = useCallback((): Exclude<ThemeMode, "system"> => {
		return resolvedTheme === "dark" ? "light" : "dark"
	}, [resolvedTheme])

	const runThemeTransition = useCallback(
		(nextTheme: ThemeMode, event: MouseEvent<HTMLElement>) => {
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

			const currentTarget = event.currentTarget
			const targetRect = currentTarget.getBoundingClientRect()
			const hasPointerOrigin = event.clientX !== 0 || event.clientY !== 0
			const originX = hasPointerOrigin ? event.clientX : targetRect.left + targetRect.width / 2
			const originY = hasPointerOrigin ? event.clientY : targetRect.top + targetRect.height / 2

			const rootElement = document.documentElement
			rootElement.style.setProperty("--theme-transition-x", `${originX}px`)
			rootElement.style.setProperty("--theme-transition-y", `${originY}px`)
			rootElement.setAttribute("data-theme-transition", "radial")

			let cleaned = false
			const cleanup = () => {
				if (cleaned) {
					return
				}

				cleaned = true
				rootElement.removeAttribute("data-theme-transition")
				rootElement.style.removeProperty("--theme-transition-x")
				rootElement.style.removeProperty("--theme-transition-y")
			}

			const cleanupTimeout = window.setTimeout(cleanup, 2000)
			const transition = transitioningDocument.startViewTransition(() => {
				setTheme(nextTheme)
			})

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
