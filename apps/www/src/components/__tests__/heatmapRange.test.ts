import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { Heatmap } from "@repo/ui/components/Heatmap"
import { describe, expect, it } from "vitest"

import { getRecentHeatmapDays } from "../lazy/heatmapRange"

const day = (date: string, count = 1) => ({ date, count })

describe("mobile heatmap range", () => {
	it("keeps the current month and the preceding two months through today", () => {
		const days = [
			day("2026-06-30"),
			day("2026-07-01", 2),
			day("2026-08-15", 3),
			day("2026-09-28", 4),
			day("2026-09-29"),
		]
		const recent = getRecentHeatmapDays(days, new Date("2026-09-28T12:00:00Z"))
		expect(recent).toEqual(days.slice(1, 4))
		expect(recent.reduce((total, item) => total + item.count, 0)).toBe(9)
		expect(days).toHaveLength(5)
	})

	it("handles the year boundary and preserves input order", () => {
		const days = [day("2026-01-01"), day("2025-10-31"), day("2025-11-01"), day("2025-12-31")]
		expect(getRecentHeatmapDays(days, new Date("2026-01-01T00:00:00Z"))).toEqual([
			days[0],
			days[2],
			days[3],
		])
	})

	it("retains leap day and accepts ISO timestamps", () => {
		const days = [day("2024-01-01"), day("2024-02-29"), day("2024-03-31T08:00:00Z")]
		expect(getRecentHeatmapDays(days, new Date("2024-03-31T12:00:00Z"))).toEqual(days)
	})

	it("excludes invalid dates and handles empty or entirely old data", () => {
		const today = new Date("2026-09-28T12:00:00Z")
		expect(getRecentHeatmapDays([], today)).toEqual([])
		expect(
			getRecentHeatmapDays([day("2026-01-01"), day("invalid"), day("2026-08-32")], today)
		).toEqual([])
	})
})

describe("heatmap range labels", () => {
	it("does not label the next month when its dates are only calendar padding", () => {
		const html = renderToStaticMarkup(
			createElement(Heatmap, {
				days: [day("2026-07-01"), day("2026-09-28")],
				orientation: "vertical",
			})
		)
		expect(html).toContain(">Jul<")
		expect(html).toContain(">Aug<")
		expect(html).toContain(">Sep<")
		expect(html).not.toContain(">Oct<")
	})
})
