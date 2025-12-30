import * as React from "react"

import { Text } from "@repo/ui"
import type { Page } from "@repo/typescript-config/typings/payload-types"

type TextBlock = Extract<NonNullable<Page["structure"]>[number], { blockType: "text" }>

export interface TextNodeProps {
	block: TextBlock
}

export function TextNode({ block }: TextNodeProps) {
	const content = block.content
	if (!content) return null

	return (
		<Text
			as={block.as ?? "p"}
			size={block.size ?? "base"}
			weight={block.weight ?? "normal"}
			tone={block.tone ?? "default"}
			align={block.align ?? "left"}
			className="whitespace-pre-wrap"
		>
			{content}
		</Text>
	)
}
