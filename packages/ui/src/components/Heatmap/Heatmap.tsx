import * as React from "react"

import { cn } from "../../utils/classnames"

export type HeatmapLevel = 0 | 1 | 2 | 3 | 4

export interface HeatmapDay {
	date: string
	count: number
	level?: HeatmapLevel
}

type HeatmapSize = "sm" | "md" | "lg"

type CSSVars = React.CSSProperties & {
	[key in `--${string}`]?: string | number
}

export interface HeatmapProps extends React.ComponentPropsWithoutRef<"div"> {
	days: HeatmapDay[]
	size?: HeatmapSize
	cellSize?: number
	gap?: number
	showLegend?: boolean
	showTotal?: boolean
}

type NormalizedHeatmapDay = {
	date: string
	count: number
	level: HeatmapLevel | undefined
}

function asDateOnlyISO(value: string): string | null {
	if (typeof value !== "string") return null
	const match = value.match(/^(\d{4}-\d{2}-\d{2})/)
	return match?.[1] ?? null
}

function parseISODate(dateISO: string): Date | null {
	const dateOnly = asDateOnlyISO(dateISO)
	if (!dateOnly) return null
	const d = new Date(`${dateOnly}T00:00:00.000Z`)
	return Number.isFinite(d.getTime()) ? d : null
}

function toISODateOnly(d: Date): string {
	const y = d.getUTCFullYear()
	const m = String(d.getUTCMonth() + 1).padStart(2, "0")
	const day = String(d.getUTCDate()).padStart(2, "0")
	return `${y}-${m}-${day}`
}

function addDaysUTC(d: Date, days: number): Date {
	const next = new Date(d)
	next.setUTCDate(next.getUTCDate() + days)
	return next
}

function startOfWeekUTC(d: Date): Date {
	const day = d.getUTCDay() // 0=Sun..6=Sat
	return addDaysUTC(d, -day)
}

function endOfWeekUTC(d: Date): Date {
	const day = d.getUTCDay()
	return addDaysUTC(d, 6 - day)
}

function computeLevelFromCount(count: number, maxCount: number): HeatmapLevel {
	if (!Number.isFinite(count) || count <= 0) return 0
	if (!Number.isFinite(maxCount) || maxCount <= 0) return 1

	const t1 = Math.max(1, Math.ceil(maxCount * 0.25))
	const t2 = Math.max(t1 + 1, Math.ceil(maxCount * 0.5))
	const t3 = Math.max(t2 + 1, Math.ceil(maxCount * 0.75))

	if (count <= t1) return 1
	if (count <= t2) return 2
	if (count <= t3) return 3
	return 4
}

const levelClass: Record<HeatmapLevel, string> = {
	0: "bg-muted/60",
	1: "bg-chart-1",
	2: "bg-chart-2",
	3: "bg-chart-3",
	4: "bg-chart-4",
}

const sizePreset: Record<HeatmapSize, { cellSize: number; gap: number }> = {
	sm: { cellSize: 10, gap: 3 },
	md: { cellSize: 12, gap: 4 },
	lg: { cellSize: 14, gap: 5 },
}

function normalizeDays(days: HeatmapDay[]) {
	const entries = days
		.map((d) => {
			const dateISO = asDateOnlyISO(d.date)
			if (!dateISO) return null
			const count = Number.isFinite(d.count) ? Math.max(0, Math.floor(d.count)) : 0
			return {
				date: dateISO,
				count,
				level: d.level,
			} satisfies NormalizedHeatmapDay
		})
		.filter((v): v is NormalizedHeatmapDay => v !== null)

	const map = new Map<string, NormalizedHeatmapDay>()
	entries.forEach((e) => map.set(e.date, e))

	const dates = entries
		.map((e) => parseISODate(e.date))
		.filter((d): d is Date => d !== null)
		.sort((a, b) => a.getTime() - b.getTime())

	const min = dates[0]
	const max = dates[dates.length - 1]

	return { map, min, max }
}

function buildCalendar(normalized: {
	map: Map<string, NormalizedHeatmapDay>
	min?: Date
	max?: Date
}) {
	if (!normalized.min || !normalized.max) {
		return { weeks: [] as HeatmapDay[][], total: 0, maxCount: 0 }
	}

	const start = startOfWeekUTC(normalized.min)
	const end = endOfWeekUTC(normalized.max)

	const allDays: HeatmapDay[] = []
	for (let d = start; d.getTime() <= end.getTime(); d = addDaysUTC(d, 1)) {
		const date = toISODateOnly(d)
		const existing = normalized.map.get(date)
		allDays.push({
			date,
			count: existing?.count ?? 0,
			level: existing?.level,
		})
	}

	let total = 0
	let maxCount = 0
	allDays.forEach((d) => {
		total += d.count
		maxCount = Math.max(maxCount, d.count)
	})

	const withLevels = allDays.map((d) => ({
		...d,
		level: d.level ?? computeLevelFromCount(d.count, maxCount),
	}))

	const weeks: HeatmapDay[][] = []
	for (let i = 0; i < withLevels.length; i += 7) {
		weeks.push(withLevels.slice(i, i + 7))
	}

	return { weeks, total, maxCount }
}

export function Heatmap({
	days,
	size = "md",
	cellSize,
	gap,
	showLegend = true,
	showTotal = false,
	className,
	...props
}: HeatmapProps) {
	const normalized = normalizeDays(days)
	const calendar = buildCalendar(normalized)

	const preset = sizePreset[size]
	const resolvedCellSize = cellSize ?? preset.cellSize
	const resolvedGap = gap ?? preset.gap

	const style: CSSVars = {
		"--heatmap-cell-size": `${resolvedCellSize}px`,
		"--heatmap-gap": `${resolvedGap}px`,
	}

	return (
		<div className={cn("flex flex-col gap-3", "text-foreground", className)} {...props}>
			{showTotal && (
				<div className="text-muted-foreground text-sm">
					{calendar.total.toLocaleString()} contributions
				</div>
			)}

			<div
				className={cn("grid grid-flow-col auto-cols-max", "gap-[var(--heatmap-gap)]")}
				style={style}
				aria-label="Contributions heatmap"
				role="group"
			>
				{calendar.weeks.map((week, weekIndex) => (
					<div key={weekIndex} className={cn("grid grid-rows-7", "gap-[var(--heatmap-gap)]")}>
						{week.map((day) => {
							const level = day.level ?? 0
							const label = `${day.count} contributions on ${day.date}`

							return (
								<div
									key={day.date}
									className={cn(
										"rounded-[4px] border border-border/40",
										"h-[var(--heatmap-cell-size)] w-[var(--heatmap-cell-size)]",
										levelClass[level]
									)}
									title={label}
									aria-label={label}
								/>
							)
						})}
					</div>
				))}
			</div>

			{showLegend && (
				<div className="flex items-center justify-end gap-2 text-muted-foreground text-xs">
					<span>Less</span>
					<div className="flex items-center gap-1">
						{([0, 1, 2, 3, 4] as const).map((lvl) => (
							<div
								key={lvl}
								className={cn(
									"rounded-[4px] border border-border/40",
									"h-[var(--heatmap-cell-size)] w-[var(--heatmap-cell-size)]",
									levelClass[lvl]
								)}
								style={style}
								aria-hidden="true"
							/>
						))}
					</div>
					<span>More</span>
				</div>
			)}
		</div>
	)
}
