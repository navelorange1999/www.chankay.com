import * as React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui"
import type { Page } from "@repo/typescript-config/typings/payload-types"

type CardBlock = Extract<NonNullable<Page["structure"]>[number], { blockType: "card" }>

export interface CardNodeProps {
	block: CardBlock
}

export function CardNode({ block }: CardNodeProps) {
	return (
		<Card className="mx-auto w-full max-w-2xl">
			<CardHeader>
				<CardTitle>{block.title}</CardTitle>
				{block.description && <CardDescription>{block.description}</CardDescription>}
			</CardHeader>
			<CardContent />
		</Card>
	)
}
