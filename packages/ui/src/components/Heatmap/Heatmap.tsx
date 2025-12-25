"use client"

import * as React from "react"
import { motion } from "motion/react"

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
	/**
	 * When set, cells animate filling in chronological order over the provided seconds.
	 * When omitted, the heatmap renders immediately with no animation.
	 */
	animateFill?: number
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
	1: "bg-primary/35",
	2: "bg-primary",
	3: "bg-[color-mix(in_oklch,var(--primary)_85%,black)] dark:bg-[color-mix(in_oklch,var(--primary)_85%,white)]",
	4: "bg-[color-mix(in_oklch,var(--primary)_70%,black)] dark:bg-[color-mix(in_oklch,var(--primary)_70%,white)]",
}

const ringClass: Record<HeatmapLevel, string> = {
	0: "ring-border/25",
	1: "ring-primary/25",
	2: "ring-primary/35",
	3: "ring-[color-mix(in_oklch,var(--primary)_70%,black)] dark:ring-[color-mix(in_oklch,var(--primary)_70%,white)]",
	4: "ring-[color-mix(in_oklch,var(--primary)_55%,black)] dark:ring-[color-mix(in_oklch,var(--primary)_55%,white)]",
}

const sizePreset: Record<HeatmapSize, { cellSize: number; gap: number }> = {
	sm: { cellSize: 10, gap: 3 },
	md: { cellSize: 12, gap: 4 },
	lg: { cellSize: 14, gap: 5 },
}

const MONTH_LABELS = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec",
] as const

function getMonthLabel(dateISO: string): string | null {
	const d = parseISODate(dateISO)
	if (!d) return null
	return MONTH_LABELS[d.getUTCMonth()] ?? null
}

function isFirstOfMonth(dateISO: string): boolean {
	return dateISO.slice(8, 10) === "01"
}

function getMonthTicks(weeks: HeatmapDay[][], minGapWeeks: number = 4) {
	const ticks = new Map<number, string>()
	let lastIndex = -999

	weeks.forEach((week, weekIndex) => {
		const monthDay = week.find((d) => isFirstOfMonth(d.date))
		if (!monthDay) return

		if (weekIndex - lastIndex < minGapWeeks) return
		const label = getMonthLabel(monthDay.date)
		if (!label) return

		ticks.set(weekIndex, label)
		lastIndex = weekIndex
	})

	return ticks
}

const WEEKDAY_LABELS: Array<{ rowIndex: number; label: "Mon" | "Wed" | "Fri" }> = [
	{ rowIndex: 1, label: "Mon" },
	{ rowIndex: 3, label: "Wed" },
	{ rowIndex: 5, label: "Fri" },
]

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
	animateFill,
	className,
	...props
}: HeatmapProps) {
	// const [hasMounted, setHasMounted] = React.useState(false)
	// const [runKey, setRunKey] = React.useState(0)

	// React.useEffect(() => {
	// 	setHasMounted(true)
	// }, [])

	const normalized = normalizeDays(days)
	const calendar = buildCalendar(normalized)
	const monthTicks = getMonthTicks(calendar.weeks)

	const preset = sizePreset[size]
	const resolvedCellSize = cellSize ?? preset.cellSize
	const resolvedGap = gap ?? preset.gap

	const style: CSSVars = {
		"--heatmap-cell-size": `${resolvedCellSize}px`,
		"--heatmap-gap": `${resolvedGap}px`,
	}

	const totalCells = calendar.weeks.length * 7
	const shouldAnimate =
		typeof animateFill === "number" && Number.isFinite(animateFill) && animateFill > 0

	const fillSpanSeconds = shouldAnimate ? animateFill : 0
	const perCellDelay = totalCells > 0 ? fillSpanSeconds / totalCells : 0
	const initialDelaySeconds = shouldAnimate ? 0.2 : 0
	const cellDurationSeconds = shouldAnimate ? 0.25 : 0
	let cellIndex = 0

	return (
		<div className={cn("flex flex-col gap-3", "text-foreground", className)} {...props}>
			{showTotal && (
				<div className="text-muted-foreground text-sm">
					{calendar.total.toLocaleString()} contributions
				</div>
			)}

			{/* GitHub-like layout (weeks as columns) */}
			<div style={style}>
				<div className="flex gap-3">
					{/* Weekday labels (left) */}
					<div className="shrink-0">
						<div className="h-5" aria-hidden="true" />
						<div className="grid grid-rows-7 gap-[var(--heatmap-gap)]">
							{Array.from({ length: 7 }).map((_, rowIndex) => {
								const tick = WEEKDAY_LABELS.find((t) => t.rowIndex === rowIndex)
								return (
									<div
										key={rowIndex}
										className={cn(
											"h-[var(--heatmap-cell-size)]",
											"w-8",
											"text-muted-foreground text-[10px] leading-[var(--heatmap-cell-size)]"
										)}
									>
										{tick?.label ?? null}
									</div>
								)
							})}
						</div>
					</div>

					{/* Month labels + grid inside scroll container */}
					<div className="max-w-full overflow-x-auto overscroll-x-contain">
						<div className="inline-flex flex-col gap-[var(--heatmap-gap)]">
							{/* Month labels (top) */}
							<div className="grid grid-flow-col auto-cols-max gap-[var(--heatmap-gap)] h-5">
								{calendar.weeks.map((_, weekIndex) => (
									<div
										key={weekIndex}
										className={cn(
											"w-[var(--heatmap-cell-size)]",
											"text-muted-foreground text-[10px] leading-5"
										)}
									>
										{monthTicks.get(weekIndex) ?? null}
									</div>
								))}
							</div>

							<div
								className={cn("grid grid-flow-col auto-cols-max", "gap-[var(--heatmap-gap)]")}
								aria-label="Contributions heatmap"
								role="group"
							>
								{calendar.weeks.map((week, weekIndex) => (
									<div
										key={weekIndex}
										className={cn("grid grid-rows-7", "gap-[var(--heatmap-gap)]")}
									>
										{week.map((day) => {
											const level = day.level ?? 0
											const label = `${day.count} contributions on ${day.date}`
											const delay = shouldAnimate
												? initialDelaySeconds + cellIndex * perCellDelay
												: 0
											cellIndex += 1

											return (
												<div
													key={day.date}
													className={cn(
														"relative overflow-hidden rounded-[4px] ring-1 ring-inset",
														"h-[var(--heatmap-cell-size)] w-[var(--heatmap-cell-size)]",
														ringClass[level],
														levelClass[0]
													)}
													title={label}
													aria-label={label}
												>
													{level > 0 && (
														<motion.div
															key={day.date}
															className={cn("absolute inset-0 rounded-[4px]", levelClass[level])}
															aria-hidden="true"
															initial={shouldAnimate ? { opacity: 0 } : false}
															animate={{ opacity: 1 }}
															transition={
																shouldAnimate
																	? {
																			delay,
																			duration: cellDurationSeconds,
																			ease: "easeOut",
																		}
																	: undefined
															}
														/>
													)}
												</div>
											)
										})}
									</div>
								))}
							</div>
						</div>
					</div>
				</div>
			</div>

			{showLegend && (
				<div
					className="flex w-full items-center justify-end gap-2 text-muted-foreground text-xs"
					style={style}
				>
					<span>Less</span>
					<div className="flex items-center gap-1">
						{([0, 1, 2, 3, 4] as const).map((lvl) => (
							<div
								key={lvl}
								className={cn(
									"rounded-[4px] ring-1 ring-inset",
									"h-[var(--heatmap-cell-size)] w-[var(--heatmap-cell-size)]",
									ringClass[lvl],
									levelClass[lvl]
								)}
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
