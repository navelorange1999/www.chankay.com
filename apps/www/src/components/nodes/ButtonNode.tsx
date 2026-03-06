import * as React from "react"
import Link from "next/link"

import { Button, buttonIconComponentMap, buttonIconValues, type ButtonIconName } from "@repo/ui"
import type { Page } from "@repo/typescript-config/typings/payload-types"

type ButtonBlock = Extract<NonNullable<Page["structure"]>[number], { blockType: "button" }>

export interface ButtonNodeProps {
	block: ButtonBlock
}

function asOptionalString(value: unknown): string | undefined {
	return typeof value === "string" && value.length > 0 ? value : undefined
}

function asBooleanWithDefault(value: unknown, fallback: boolean): boolean {
	return typeof value === "boolean" ? value : fallback
}

const buttonVariants = [
	"default",
	"secondary",
	"outline",
	"ghost",
	"link",
	"destructive",
	"primary",
] as const

const buttonSizes = ["default", "sm", "lg", "icon"] as const
const iconPositions = ["left", "right"] as const

type ButtonVariant = (typeof buttonVariants)[number]
type ButtonSize = (typeof buttonSizes)[number]

function asOneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
	return typeof value === "string" && allowed.includes(value as T) ? (value as T) : fallback
}

export function renderButtonBlock(blockData: Record<string, unknown>, key?: string) {
	const label = asOptionalString(blockData.label)
	const href = asOptionalString(blockData.href)
	const external = asBooleanWithDefault(blockData.external, false)
	const variantRaw = asOneOf(blockData.variant, buttonVariants, "default")
	const variant = variantRaw === "primary" ? "default" : variantRaw
	const size = asOneOf(blockData.size, buttonSizes, "default")
	const icon = asOneOf(blockData.icon, buttonIconValues, "none") as ButtonIconName
	const iconPosition = asOneOf(blockData.iconPosition, iconPositions, "left")

	if (!href) return null

	const IconComp = icon === "none" ? null : buttonIconComponentMap[icon]
	const iconNode = IconComp ? <IconComp className="h-4 w-4" /> : null
	const hasText = Boolean(label)
	if (!iconNode && !hasText) return null

	return (
		<Button key={key} asChild variant={variant} size={size}>
			<Link href={href} target={external ? "_blank" : undefined}>
				{iconPosition === "left" && iconNode}
				{hasText ? label : null}
				{iconPosition === "right" && iconNode}
			</Link>
		</Button>
	)
}

export function ButtonNode({ block }: ButtonNodeProps) {
	const blockData = block as unknown as Record<string, unknown>

	return renderButtonBlock(blockData)
}
