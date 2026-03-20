"use client"

import dynamic from "next/dynamic"

import type { HandWritingProps } from "@repo/ui/components/Text"

const HandWriting = dynamic(
	() => import("@repo/ui/components/Text").then((module) => module.HandWriting),
	{
		ssr: false,
		loading: () => <div aria-hidden="true" className="h-full w-full rounded-3xl bg-primary/5" />,
	}
)

export function HandWritingClient(props: HandWritingProps) {
	return <HandWriting {...props} />
}
