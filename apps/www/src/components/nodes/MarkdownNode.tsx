import * as React from "react"

import { Markdown } from "@repo/ui/components/Markdown"
import type { Page } from "@repo/typescript-config/typings/payload-types"

type MarkdownBlock = Extract<NonNullable<Page["structure"]>[number], { blockType: "markdown" }>

export interface MarkdownNodeProps {
	block: MarkdownBlock
}

export function MarkdownNode({ block }: MarkdownNodeProps) {
	const content = block.content
	if (!content) return null

	return <Markdown content={content} />
}
