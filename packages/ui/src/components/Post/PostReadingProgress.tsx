"use client"

import * as React from "react"

import { cn } from "#utils/classnames"

interface PostReadingProgressProps extends React.ComponentProps<"div"> {
	targetId: string
}

function clampProgress(value: number): number {
	return Math.min(1, Math.max(0, value))
}

function resolveNavbarOffset(): number {
	if (typeof window === "undefined") return 64

	const rootStyles = window.getComputedStyle(document.documentElement)
	const rawValue = rootStyles.getPropertyValue("--navbar-height").trim()

	if (rawValue.endsWith("rem")) {
		const remValue = Number.parseFloat(rawValue.slice(0, -3))
		if (Number.isFinite(remValue)) {
			const rootFontSize = Number.parseFloat(rootStyles.fontSize)
			return remValue * (Number.isFinite(rootFontSize) ? rootFontSize : 16)
		}
	}

	if (rawValue.endsWith("px")) {
		const pxValue = Number.parseFloat(rawValue.slice(0, -2))
		if (Number.isFinite(pxValue)) {
			return pxValue
		}
	}

	return 64
}

function resolveReadingProgress(target: HTMLElement, navbarOffset: number): number {
	const rect = target.getBoundingClientRect()
	const targetTop = window.scrollY + rect.top
	const targetHeight = rect.height
	const viewportHeight = window.innerHeight

	const start = Math.max(0, targetTop - navbarOffset)
	const end = Math.max(start, targetTop + targetHeight - viewportHeight)
	const distance = end - start

	if (distance <= 0) {
		return window.scrollY >= start ? 1 : 0
	}

	return clampProgress((window.scrollY - start) / distance)
}

export function PostReadingProgress({ targetId, className, ...props }: PostReadingProgressProps) {
	const [progress, setProgress] = React.useState(0)
	const progressRef = React.useRef(0)

	React.useEffect(() => {
		let frameId = 0
		let resizeObserver: ResizeObserver | null = null
		let observedTarget: HTMLElement | null = null

		const setNextProgress = (value: number) => {
			if (Math.abs(progressRef.current - value) < 0.001) return
			progressRef.current = value
			setProgress(value)
		}

		const updateProgress = () => {
			frameId = 0
			const target = document.getElementById(targetId)

			if (!target) {
				setNextProgress(0)
				return
			}

			if (target !== observedTarget) {
				resizeObserver?.disconnect()
				resizeObserver = new ResizeObserver(requestUpdate)
				resizeObserver.observe(target)
				observedTarget = target
			}

			setNextProgress(resolveReadingProgress(target, resolveNavbarOffset()))
		}

		const requestUpdate = () => {
			if (frameId !== 0) return
			frameId = window.requestAnimationFrame(updateProgress)
		}

		requestUpdate()
		window.addEventListener("scroll", requestUpdate, { passive: true })
		window.addEventListener("resize", requestUpdate)

		return () => {
			if (frameId !== 0) {
				window.cancelAnimationFrame(frameId)
			}
			resizeObserver?.disconnect()
			window.removeEventListener("scroll", requestUpdate)
			window.removeEventListener("resize", requestUpdate)
		}
	}, [targetId])

	return (
		<div
			data-slot="post-reading-progress"
			className={cn(
				"pointer-events-none fixed inset-x-0 top-[var(--navbar-height,4rem)] z-[60] h-0.5 lg:hidden",
				className
			)}
			aria-hidden="true"
			{...props}
		>
			<div className="h-full bg-primary/75" style={{ width: `${(progress * 100).toFixed(2)}%` }} />
		</div>
	)
}
