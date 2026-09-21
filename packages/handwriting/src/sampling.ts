import type { Point } from "./geometry.js"

/** Internal sampling seam returns coordinates only; it cannot create a versioned artifact. */
export async function collectPoints(
	iterator: Iterator<readonly number[], { complete: boolean; steps: number }>,
	signal?: AbortSignal
): Promise<Point[]> {
	const points: Point[] = []
	const aborted = () => {
		if (signal?.aborted) throw new DOMException("Generation cancelled.", "AbortError")
	}
	while (true) {
		aborted()
		const next = iterator.next()
		if (next.done) {
			if (!next.value.complete)
				throw new Error("Generation did not complete. Try another seed or shorter text.")
			break
		}
		points.push(next.value as unknown as Point)
		if (points.length % 8 === 0) await new Promise<void>((resolve) => setTimeout(resolve, 0))
	}
	aborted()
	if (!points.length) throw new Error("Model generated an empty result.")
	return points
}
