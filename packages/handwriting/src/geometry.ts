import type { HandwritingArtifact } from "./schema.js"
export type Point = readonly [number, number, number]
type Coordinate = readonly [number, number]
const rounded = (value: number) => Number(value.toFixed(3))
const pair = (point: Coordinate) => `${rounded(point[0])},${rounded(point[1])}`
/** Cubic control hulls bound the complete curve, including overshoot between samples. */
export function buildGeometry(
	points: readonly Point[]
): Pick<HandwritingArtifact, "viewBox" | "strokes"> {
	if (!points.length || points.length > 2000) throw new Error("Invalid point count.")
	const groups: Coordinate[][] = []
	let current: Coordinate[] = []
	for (const [x, y, up] of points) {
		if (!Number.isFinite(x) || !Number.isFinite(y) || Math.abs(x) > 90_000 || Math.abs(y) > 90_000)
			throw new Error("Invalid model coordinate.")
		current.push([x, y])
		if (up) {
			groups.push(current)
			current = []
		}
	}
	if (current.length) groups.push(current)
	let minimumX = Infinity,
		maximumX = -Infinity,
		minimumY = Infinity,
		maximumY = -Infinity
	const include = ([x, y]: Coordinate) => {
		minimumX = Math.min(minimumX, x)
		maximumX = Math.max(maximumX, x)
		minimumY = Math.min(minimumY, y)
		maximumY = Math.max(maximumY, y)
	}
	const lengths: number[] = []
	const paths = groups.map((group) => {
		let path = `M${pair(group[0]!)}`,
			length = 0
		group.forEach(include)
		if (group.length === 1) {
			lengths.push(0.001)
			return `${path}l0.001,0`
		}
		for (let i = 0; i < group.length - 1; i++) {
			const a = group[Math.max(0, i - 1)]!,
				b = group[i]!,
				c = group[i + 1]!,
				d = group[Math.min(group.length - 1, i + 2)]!
			const first: Coordinate = [b[0] + (c[0] - a[0]) / 6, b[1] + (c[1] - a[1]) / 6]
			const second: Coordinate = [c[0] - (d[0] - b[0]) / 6, c[1] - (d[1] - b[1]) / 6]
			include(first)
			include(second)
			path += `C${pair(first)} ${pair(second)} ${pair(c)}`
			let previous = b
			for (let sample = 1; sample <= 8; sample++) {
				const t = sample / 8,
					u = 1 - t
				const next: Coordinate = [
					u * u * u * b[0] +
						3 * u * u * t * first[0] +
						3 * u * t * t * second[0] +
						t * t * t * c[0],
					u * u * u * b[1] +
						3 * u * u * t * first[1] +
						3 * u * t * t * second[1] +
						t * t * t * c[1],
				]
				length += Math.hypot(next[0] - previous[0], next[1] - previous[1])
				previous = next
			}
		}
		lengths.push(length)
		return path
	})
	// A five-unit margin also covers renderer stroke widths up to three units.
	const viewBox: HandwritingArtifact["viewBox"] = [
		rounded(minimumX - 5),
		rounded(minimumY - 5),
		rounded(maximumX - minimumX + 10.002),
		rounded(maximumY - minimumY + 10.002),
	]
	let delay = 0
	const strokes = paths.map((d, index) => {
		const duration = Math.max(0.025, lengths[index]! / 90)
		const result = { d, duration, delay }
		delay += duration
		return result
	})
	return { viewBox, strokes }
}
