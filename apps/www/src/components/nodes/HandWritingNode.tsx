import * as React from "react"

import type { Page } from "@repo/typescript-config/typings/payload-types"

import HandWriting from "@repo/ui/components/Text/HandWriting"
import { normalizeInput } from "@chankay/handwriting/schema"
import { getHandwriting } from "@/services/handwriting"

type HandWritingBlock = Extract<
	NonNullable<Page["structure"]>[number],
	{ blockType: "handWriting" }
>

export interface HandWritingNodeProps {
	block: HandWritingBlock
}

export async function HandWritingNode({ block }: HandWritingNodeProps) {
	const input = normalizeInput({
		text: block.text ?? "Hello world",
		style: block.style ?? "rounded",
		seed: block.seed ?? 42,
		legibility: block.legibility ?? 0.85,
	})
	const artifact = await getHandwriting(input)
	return (
		<div className="flex justify-center px-4 text-primary">
			<HandWriting
				artifact={artifact}
				text={input.text}
				className="h-40 w-full max-w-[32rem] sm:h-52 md:h-64"
				speed={block.speed ?? 1}
				as={block.as ?? "div"}
			/>
		</div>
	)
}
