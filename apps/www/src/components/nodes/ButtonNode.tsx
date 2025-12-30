import * as React from "react"
import Link from "next/link"

import { Button } from "@repo/ui"
import type { Page } from "@repo/typescript-config/typings/payload-types"

type ButtonBlock = Extract<NonNullable<Page["structure"]>[number], { blockType: "button" }>

export interface ButtonNodeProps {
	block: ButtonBlock
}

export function ButtonNode({ block }: ButtonNodeProps) {
	return (
		<div className="flex justify-center">
			<Button asChild variant={block.variant === "secondary" ? "secondary" : "default"}>
				<Link href={block.href} target={block.external ? "_blank" : undefined}>
					{block.label}
				</Link>
			</Button>
		</div>
	)
}
