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
	runThemeTransition: (nextTheme: ThemeMode) => void
}

interface ThemeTransitionViewport {
	height: number
	width: number
}

interface ThemeTransitionEnvironment {
	devicePixelRatio: number
	userAgent: string
}

type ThemeTransitionMode = "fade" | "radial"

interface ThemeTransitionGeometry {
	origin: string
	radius: number
}

interface ThemeTransitionAnimation {
	keyframes: Keyframe[] | PropertyIndexedKeyframes
	options: KeyframeAnimationOptions
}

interface ThemeRootElement {
	classList: Pick<DOMTokenList, "add" | "remove">
	setAttribute: (qualifiedName: string, value: string) => void
	style: Pick<CSSStyleDeclaration, "colorScheme">
}

export function applyThemeChange(
	rootElement: ThemeRootElement,
	nextTheme: ThemeMode,
	prefersDark: boolean,
	setTheme: (theme: ThemeMode) => void
) {
	const resolvedTheme = nextTheme === "system" ? (prefersDark ? "dark" : "light") : nextTheme

	rootElement.classList.remove("light", "dark")
	rootElement.classList.add(resolvedTheme)
	rootElement.setAttribute("data-theme", resolvedTheme)
	rootElement.style.colorScheme = resolvedTheme
	setTheme(nextTheme)
}

export function resolveThemeTransitionGeometry(viewport: ThemeTransitionViewport) {
	return {
		origin: "100% 0%",
		radius: Math.hypot(viewport.width, viewport.height),
	}
}

export function resolveThemeTransitionMode({
	devicePixelRatio,
	userAgent,
}: ThemeTransitionEnvironment): ThemeTransitionMode {
	const chromiumVersion = /\b(?:Chrome|Chromium)\/(\d+)/.exec(userAgent)?.[1]
	const chromiumMajor = chromiumVersion ? Number.parseInt(chromiumVersion, 10) : undefined
	// Chromium 150-152 can render the first composited clip-path animation at the wrong
	// scale on high-DPR displays, then snap to the final frame. Fade only for that known
	// range so fixed Chromium builds keep the radial transition.
	// https://issues.chromium.org/issues/542859657
	const hasAffectedChromiumVersion =
		chromiumMajor !== undefined && chromiumMajor >= 150 && chromiumMajor <= 152

	return hasAffectedChromiumVersion && devicePixelRatio > 1 ? "fade" : "radial"
}

export function resolveThemeTransitionAnimation(
	mode: ThemeTransitionMode,
	geometry: ThemeTransitionGeometry
): ThemeTransitionAnimation {
	const sharedOptions = {
		fill: "both",
		pseudoElement: "::view-transition-new(root)",
	} as const

	if (mode === "fade") {
		return {
			keyframes: { opacity: [0, 1] },
			options: {
				...sharedOptions,
				duration: 300,
				easing: "ease-out",
			},
		}
	}

	return {
		keyframes: {
			clipPath: [
				`circle(0px at ${geometry.origin})`,
				`circle(${geometry.radius}px at ${geometry.origin})`,
			],
		},
		options: {
			...sharedOptions,
			duration: 1200,
			easing: "cubic-bezier(0.22, 1, 0.36, 1)",
		},
	}
}

export function settleThemeTransition(
	transition: Pick<ViewTransitionHandle, "finished">,
	cleanup: () => void
) {
	return transition.finished.then(cleanup, cleanup)
}

export function useThemeTransition({
	resolvedTheme,
	setTheme,
}: UseThemeTransitionOptions): ThemeTransitionApi {
	const getBinaryNextTheme = useCallback((): Exclude<ThemeMode, "system"> => {
		return resolvedTheme === "dark" ? "light" : "dark"
	}, [resolvedTheme])

	const runThemeTransition = useCallback(
		(nextTheme: ThemeMode) => {
			if (typeof document === "undefined" || typeof window === "undefined") {
				setTheme(nextTheme)
				return
			}

			const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
			const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
			const transitioningDocument = document as DocumentWithViewTransition
			if (!transitioningDocument.startViewTransition || reducedMotion) {
				setTheme(nextTheme)
				return
			}

			const geometry = resolveThemeTransitionGeometry({
				height: window.innerHeight,
				width: window.innerWidth,
			})
			const transitionMode = resolveThemeTransitionMode({
				devicePixelRatio: window.devicePixelRatio,
				userAgent: window.navigator.userAgent,
			})
			const transitionAnimation = resolveThemeTransitionAnimation(transitionMode, geometry)

			const rootElement = document.documentElement
			rootElement.setAttribute("data-theme-transition", transitionMode)

			let cleaned = false
			const cleanup = () => {
				if (cleaned) {
					return
				}

				cleaned = true
				rootElement.removeAttribute("data-theme-transition")
			}

			const transition = transitioningDocument.startViewTransition(() => {
				applyThemeChange(rootElement, nextTheme, prefersDark, setTheme)
			})

			transition.ready
				.then(() => {
					rootElement.animate(transitionAnimation.keyframes, transitionAnimation.options)
				})
				.catch(() => undefined)

			void settleThemeTransition(transition, cleanup)
		},
		[setTheme]
	)

	return {
		getBinaryNextTheme,
		runThemeTransition,
	}
}
