export type LoginHeatmapDay = {
	date: string
	count: number
}

function toISODateOnly(date: Date) {
	const year = date.getUTCFullYear()
	const month = String(date.getUTCMonth() + 1).padStart(2, "0")
	const day = String(date.getUTCDate()).padStart(2, "0")
	return `${year}-${month}-${day}`
}

function getHeatmapCount(date: Date, index: number) {
	const weekday = date.getUTCDay()
	const base = weekday === 0 ? 0 : weekday === 6 ? 1 : 4
	const wave = Math.sin(index / 6) * 2 + Math.cos(index / 15) * 1.5
	const burst = index % 37 === 0 ? 10 : index % 19 === 0 ? 6 : 0
	const cooldown = index % 13 === 0 ? 4 : 0

	return Math.max(0, Math.round(base + wave + burst - cooldown))
}

function buildLoginHeatmap(days: number): LoginHeatmapDay[] {
	const end = new Date()
	end.setUTCHours(0, 0, 0, 0)

	const start = new Date(end)
	start.setUTCDate(start.getUTCDate() - (days - 1))

	return Array.from({ length: days }, (_, index) => {
		const date = new Date(start)
		date.setUTCDate(start.getUTCDate() + index)

		return {
			date: toISODateOnly(date),
			count: getHeatmapCount(date, index),
		}
	})
}

export const loginHeatmapDays = buildLoginHeatmap(182)
