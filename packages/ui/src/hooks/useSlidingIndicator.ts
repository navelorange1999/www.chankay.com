import { useState, useRef, useCallback, useEffect } from "react"

export interface SlidingIndicatorPosition {
	left: number
	width: number
}

/**
 * Hook that tracks and animates a sliding indicator (e.g., an underline)
 * based on which item in a container is currently active.
 *
 * Returns the container ref, a callback to register item refs,
 * and the current indicator position (or null if no active item).
 */
export function useSlidingIndicator(activeKey: string) {
	const [indicator, setIndicator] = useState<SlidingIndicatorPosition | null>(null)
	const containerRef = useRef<HTMLDivElement>(null)
	const itemRefs = useRef<Map<string, HTMLElement>>(new Map())

	// Callback ref to register/unregister each item element
	const setItemRef = useCallback((key: string, el: HTMLElement | null) => {
		if (el) {
			itemRefs.current.set(key, el)
		} else {
			itemRefs.current.delete(key)
		}
	}, [])

	// Measure the active item and update indicator position
	const updateIndicator = useCallback(() => {
		const container = containerRef.current
		if (!container) return

		const activeEl = itemRefs.current.get(activeKey)
		if (activeEl) {
			const containerRect = container.getBoundingClientRect()
			const activeRect = activeEl.getBoundingClientRect()
			setIndicator({
				left: activeRect.left - containerRect.left,
				width: activeRect.width,
			})
		} else {
			setIndicator(null)
		}
	}, [activeKey])

	// Re-measure on activeKey change and on mount
	useEffect(() => {
		updateIndicator()
	}, [updateIndicator])

	// Re-measure on container resize via ResizeObserver
	useEffect(() => {
		const container = containerRef.current
		if (!container) return

		const observer = new ResizeObserver(() => {
			updateIndicator()
		})
		observer.observe(container)

		return () => observer.disconnect()
	}, [updateIndicator])

	return { containerRef, setItemRef, indicator }
}
