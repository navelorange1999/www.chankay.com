"use client"

import dynamic from "next/dynamic"

import type { HandWritingProps } from "@repo/ui/components/Text"

const HandWriting = dynamic(
	() => import("@repo/ui/components/Text").then((module) => module.HandWriting),
	{
		ssr: false,
		loading: () => <></>,
	}
)

export function HandWritingClient(props: HandWritingProps) {
	return <HandWriting {...props} />
}
