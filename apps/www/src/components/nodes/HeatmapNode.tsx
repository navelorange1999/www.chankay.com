import { Heatmap } from "@repo/ui"
import type { Page } from "@repo/typescript-config/typings/payload-types"

type HeatmapSize = "sm" | "md" | "lg"

type HeatmapDay = {
	date: string
	count: number
	level?: 0 | 1 | 2 | 3 | 4
}

type HeatmapApiResponse = {
	days?: HeatmapDay[]
}

type HeatmapBlock = Extract<NonNullable<Page["structure"]>[number], { blockType: "heatmap" }>

const REVALIDATE_SECONDS = 86400

function asOptionalString(value: unknown): string | undefined {
	return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined
}

function asSize(value: unknown): HeatmapSize | undefined {
	return value === "sm" || value === "md" || value === "lg" ? value : undefined
}

function asBool(value: unknown): boolean | undefined {
	return typeof value === "boolean" ? value : undefined
}

function asNumber(value: unknown): number | undefined {
	return typeof value === "number" && Number.isFinite(value) ? value : undefined
}

function normalizeCustomDays(customData: unknown): HeatmapDay[] {
	if (!customData || typeof customData !== "object") return []
	const obj = customData as Record<string, unknown>
	const days = obj.days
	if (!Array.isArray(days)) return []

	return days
		.map((d) => {
			if (!d || typeof d !== "object") return null
			const row = d as Record<string, unknown>
			const date = typeof row.date === "string" ? row.date : null
			const count = typeof row.count === "number" ? row.count : null
			if (!date || count === null) return null
			return { date, count }
		})
		.filter((v): v is { date: string; count: number } => v !== null)
}

async function fetchGithubHeatmapDays(args: {
	username: string
	range?: string
	revalidateSeconds: number
}): Promise<HeatmapDay[]> {
	const base = process.env.PAYLOAD_API_URL || "http://localhost:3001/api"
	const url = new URL(`${base}/github/heatmap`)
	url.searchParams.set("username", args.username)
	if (args.range) url.searchParams.set("range", args.range)

	const response = await fetch(url.toString(), {
		method: "GET",
		headers: { "Content-Type": "application/json" },
		next: { revalidate: args.revalidateSeconds },
	})

	if (!response.ok) return []

	const json = (await response.json()) as HeatmapApiResponse
	return Array.isArray(json.days) ? json.days : []
}

export interface HeatmapNodeProps {
	block: HeatmapBlock
}

export async function HeatmapNode({ block }: HeatmapNodeProps) {
	const source = block.source === "custom" ? "custom" : "github"

	const size = asSize(block.display?.size) ?? "md"
	const showLegend = asBool(block.display?.showLegend) ?? true
	const showTotal = asBool(block.display?.showTotal) ?? false
	const animateFill = asNumber(block.display?.animateFill)

	let days: HeatmapDay[] = []

	if (source === "custom") {
		days = normalizeCustomDays(block.custom?.customData)
	} else {
		const username = asOptionalString(block.github?.username)
		if (username) {
			days = await fetchGithubHeatmapDays({
				username,
				range: asOptionalString(block.github?.range),
				revalidateSeconds: REVALIDATE_SECONDS,
			})
		}
	}

	if (!days || days.length === 0) return null

	return (
		<Heatmap
			days={days}
			size={size}
			showLegend={showLegend}
			showTotal={showTotal}
			animateFill={animateFill}
		/>
	)
}
