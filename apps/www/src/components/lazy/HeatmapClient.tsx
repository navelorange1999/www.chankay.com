"use client"

import dynamic from "next/dynamic"

import type { HeatmapProps } from "@repo/ui/components/Heatmap"

const Heatmap = dynamic(
	() => import("@repo/ui/components/Heatmap").then((module) => module.Heatmap),
	{
		ssr: false,
		loading: () => <></>,
	}
)

export function HeatmapClient(props: HeatmapProps) {
	return <Heatmap {...props} />
}
