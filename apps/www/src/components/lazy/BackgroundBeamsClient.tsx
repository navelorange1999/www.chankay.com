"use client"

import dynamic from "next/dynamic"

import type { BackgroundBeamsProps } from "@repo/ui/components/Backgrounds"

const BackgroundBeams = dynamic(
	() => import("@repo/ui/components/Backgrounds").then((module) => module.BackgroundBeams),
	{
		ssr: false,
		loading: () => <></>,
	}
)

export function BackgroundBeamsClient(props: BackgroundBeamsProps) {
	return <BackgroundBeams {...props} />
}
