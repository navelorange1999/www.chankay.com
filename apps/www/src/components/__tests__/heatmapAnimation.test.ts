import { describe, expect, it } from "vitest"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { Heatmap } from "@repo/ui/components/Heatmap"

const days = [
	{ date: "2026-09-20", count: 0 },
	{ date: "2026-09-21", count: 10 },
	{ date: "2026-09-22", count: 20 },
]

describe("heatmap animation completion", () => {
	it("keeps animation ownership in CSS through delay, fade and completion", () => {
		const html = renderToStaticMarkup(createElement(Heatmap, { days, duration: 6 }))
		expect(html).toContain("@keyframes chankay-heatmap-fill")
		expect(html).toContain("both")
		// No stale inline opacity is exposed when a native animation finishes.
		expect(html).not.toContain('style="opacity:0"')
		expect(html.match(/<div[^>]* data-animated="true"/g)).toHaveLength(2)
		expect(html).toContain("prefers-reduced-motion: reduce")
	})
	it("renders static cells without an animation when disabled", () => {
		const html = renderToStaticMarkup(createElement(Heatmap, { days }))
		expect(html).not.toContain("data-animated")
		expect(html).not.toContain("@keyframes")
		expect(html).not.toContain("opacity:0")
	})
})

describe("heatmap total duration", () => {
	for (const orientation of ["horizontal", "vertical"] as const) {
		it(`ends the final filled cell at duration in ${orientation} layout`, () => {
			const html = renderToStaticMarkup(
				createElement(Heatmap, { days, duration: 0.1, orientation })
			)
			const delays = [...html.matchAll(/--heatmap-fill-delay:([\d.e+-]+)s/g)].map((m) =>
				Number(m[1])
			)
			const fades = [...html.matchAll(/--heatmap-fill-duration:([\d.e+-]+)s/g)].map((m) =>
				Number(m[1])
			)
			expect(delays).toHaveLength(2)
			expect(delays[0]).toBe(0)
			expect(delays[1]! + fades[1]!).toBeCloseTo(0.1)
			expect(html).toContain("var(--heatmap-fill-duration)")
		})
	}
	it("gives a single filled cell the entire duration", () => {
		const html = renderToStaticMarkup(
			createElement(Heatmap, { days: [{ date: "2026-09-21", count: 10 }], duration: 6 })
		)
		expect(html).toContain("--heatmap-fill-delay:0s")
		expect(html).toContain("--heatmap-fill-duration:6s")
	})
})
