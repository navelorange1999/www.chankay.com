import * as React from "react"

import { HandWriting } from "@repo/ui"
import type { Page } from "@repo/typescript-config/typings/payload-types"

type HandWritingBlock = Extract<
	NonNullable<Page["structure"]>[number],
	{ blockType: "handWriting" }
>

export interface HandWritingNodeProps {
	block: HandWritingBlock
}

export function HandWritingNode({ block }: HandWritingNodeProps) {
	return (
		<div className="flex justify-center px-4 text-primary">
			<HandWriting
				className="h-40 w-full max-w-[32rem] sm:h-52 md:h-64"
				speed={block.speed ?? 1}
				as={block.as ?? "div"}
			/>
		</div>
	)
}
