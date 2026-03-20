"use client"

import dynamic from "next/dynamic"

import type { BackgroundBeamsProps } from "@repo/ui/components/Backgrounds"
import { SkeletonBasic } from "@repo/ui/components/Skeletons"

const BackgroundBeams = dynamic(
	() => import("@repo/ui/components/Backgrounds").then((module) => module.BackgroundBeams),
	{
		ssr: false,
		loading: () => (
			<SkeletonBasic
				aria-hidden="true"
				className="absolute inset-0 rounded-none bg-[radial-gradient(circle_at_center,hsl(var(--accent)/0.55),transparent_70%)]"
			/>
		),
	}
)

export function BackgroundBeamsClient(props: BackgroundBeamsProps) {
	return <BackgroundBeams {...props} />
}
