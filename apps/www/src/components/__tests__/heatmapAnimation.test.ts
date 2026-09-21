import { describe, expect, it } from "vitest"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { Heatmap } from "../../../../../packages/ui/src/components/Heatmap/Heatmap"

const days = [
	{ date: "2026-09-20", count: 0 },
	{ date: "2026-09-21", count: 10 },
	{ date: "2026-09-22", count: 20 },
]

describe("heatmap animation completion", () => {
	it("keeps animation ownership in CSS through delay, fade and completion", () => {
		const html = renderToStaticMarkup(createElement(Heatmap, { days, animateFill: 6 }))
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
