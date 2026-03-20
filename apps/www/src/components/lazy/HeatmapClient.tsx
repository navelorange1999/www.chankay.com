"use client"

import dynamic from "next/dynamic"

import type { HeatmapProps } from "@repo/ui/components/Heatmap"

const Heatmap = dynamic(
	() => import("@repo/ui/components/Heatmap").then((module) => module.Heatmap),
	{
		ssr: false,
		loading: () => (
			<div
				aria-hidden="true"
				className="w-full rounded-xl border border-border bg-card/40 p-4 text-sm text-muted-foreground"
			>
				Loading heatmap...
			</div>
		),
	}
)

export function HeatmapClient(props: HeatmapProps) {
	return <Heatmap {...props} />
}
