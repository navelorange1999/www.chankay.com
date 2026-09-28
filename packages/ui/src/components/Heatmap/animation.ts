export function getHeatmapTimings(cellCount: number, duration?: number) {
	if (!duration || !Number.isFinite(duration) || duration <= 0 || cellCount <= 0) return []

	const cellDuration = cellCount === 1 ? duration : Math.min(0.25, duration / cellCount)
	const stagger = cellCount > 1 ? (duration - cellDuration) / (cellCount - 1) : 0

	return Array.from({ length: cellCount }, (_, index) => ({
		delay: index * stagger,
		duration: cellDuration,
	}))
}
