import type { HeatmapDay } from "@repo/ui/components/Heatmap"

export function getRecentHeatmapDays(days: HeatmapDay[], today = new Date()): HeatmapDay[] {
	const end = today.toISOString().slice(0, 10)
	const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 2, 1))
		.toISOString()
		.slice(0, 10)

	return days.filter((day) => {
		const date = day.date.slice(0, 10)
		if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < start || date > end) return false
		const parsed = new Date(`${date}T00:00:00.000Z`)
		return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date
	})
}
