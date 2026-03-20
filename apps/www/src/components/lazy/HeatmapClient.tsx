"use client"

import dynamic from "next/dynamic"

import type { HeatmapProps } from "@repo/ui/components/Heatmap"
import { SkeletonBasic } from "@repo/ui/components/Skeletons"

function HeatmapSkeleton() {
	return (
		<div aria-hidden="true" className="w-full rounded-xl border border-border bg-card/40 p-4">
			<div className="mb-4 flex items-center justify-between gap-4">
				<SkeletonBasic className="h-4 w-28 rounded-full" />
				<SkeletonBasic className="h-4 w-16 rounded-full" />
			</div>

			<div className="space-y-3">
				<div className="flex gap-2 pl-8">
					{Array.from({ length: 5 }).map((_, index) => (
						<SkeletonBasic key={`heatmap-month-${index}`} className="h-3 w-10 rounded-full" />
					))}
				</div>

				<div className="grid grid-cols-[1.25rem_1fr] gap-3">
					<div className="flex flex-col gap-2 pt-1">
						{Array.from({ length: 3 }).map((_, index) => (
							<SkeletonBasic key={`heatmap-axis-${index}`} className="h-3 w-5 rounded-full" />
						))}
					</div>

					<div className="grid grid-cols-12 gap-1.5">
						{Array.from({ length: 84 }).map((_, index) => (
							<SkeletonBasic
								key={`heatmap-cell-${index}`}
								className="aspect-square rounded-[4px]"
							/>
						))}
					</div>
				</div>

				<div className="flex justify-end gap-1.5 pt-1">
					{Array.from({ length: 5 }).map((_, index) => (
						<SkeletonBasic key={`heatmap-legend-${index}`} className="size-3 rounded-[3px]" />
					))}
				</div>
			</div>
		</div>
	)
}

const Heatmap = dynamic(
	() => import("@repo/ui/components/Heatmap").then((module) => module.Heatmap),
	{
		ssr: false,
		loading: HeatmapSkeleton,
	}
)

export function HeatmapClient(props: HeatmapProps) {
	return <Heatmap {...props} />
}
