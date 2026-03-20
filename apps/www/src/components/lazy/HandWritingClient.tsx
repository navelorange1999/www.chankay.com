"use client"

import * as React from "react"

import { SkeletonBasic } from "@repo/ui/components/Skeletons"
import type { HandWritingProps } from "@repo/ui/components/Text"

type HandWritingComponent = typeof import("@repo/ui/components/Text").HandWriting

export function HandWritingClient(props: HandWritingProps) {
	const [HandWriting, setHandWriting] = React.useState<HandWritingComponent | null>(null)

	React.useEffect(() => {
		let isActive = true

		void import("@repo/ui/components/Text").then((module) => {
			if (isActive) {
				setHandWriting(() => module.HandWriting)
			}
		})

		return () => {
			isActive = false
		}
	}, [])

	if (!HandWriting) {
		return (
			<SkeletonBasic
				aria-hidden="true"
				className={[props.className, "rounded-3xl bg-primary/8"].filter(Boolean).join(" ")}
			/>
		)
	}

	return <HandWriting {...props} />
}
