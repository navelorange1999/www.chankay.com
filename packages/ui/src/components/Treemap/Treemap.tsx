"use client"

import { hierarchy, treemap } from "d3-hierarchy"
import { useEffect, useMemo, useRef, useState } from "react"

import { cn } from "#utils/classnames"

export type TreemapNode =
	| { id: string; label: string; value: number; children?: never }
	| { id: string; label: string; children: readonly TreemapNode[]; value?: never }

export type TreemapTone = "chart-1" | "chart-2" | "chart-3" | "chart-4" | "chart-5"

export type TreemapProps = {
	data: TreemapNode
	ariaLabel: string
	className?: string
	nodeTones?: Readonly<Record<string, TreemapTone>>
	focusedNodeId?: string | null
	onFocusChange?: (nodeId: string | null) => void
	onLeafActivate?: (nodeId: string) => void
}

type LayoutNode = {
	id: string
	label: string
	value: number
	x: number
	y: number
	width: number
	height: number
	branchId: string
}

function validateTree(node: TreemapNode, seen: Set<string>): number {
	if (typeof node.id !== "string" || !node.id || seen.has(node.id))
		throw new Error("Invalid Treemap node ID")
	if (typeof node.label !== "string") throw new Error("Invalid Treemap node label")
	seen.add(node.id)
	if ("children" in node && Array.isArray(node.children)) {
		return node.children.reduce((sum, child) => sum + validateTree(child, seen), 0)
	}
	const value = "value" in node ? node.value : undefined
	if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
		throw new Error("Invalid Treemap leaf value")
	}
	return value
}

export function computeTreemapLayout(
	data: TreemapNode,
	width: number,
	height: number,
	focusedNodeId?: string | null
) {
	if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0)
		return { nodes: [] as LayoutNode[], focusedNodeId: null }
	const total = validateTree(data, new Set())
	if (total <= 0 || !("children" in data) || !data.children?.length)
		return { nodes: [] as LayoutNode[], focusedNodeId: null }
	const focused = data.children.find((child) => "children" in child && child.id === focusedNodeId)
	const visible = focused ?? data
	const root = treemap<TreemapNode>()
		.size([width, height])
		.paddingInner(3)
		.paddingOuter(3)
		.paddingTop((node) => (node.depth === 0 ? 3 : 44))(
		hierarchy(visible, (node) =>
			"children" in node ? (node.children as TreemapNode[]) : undefined
		).sum((node) => ("value" in node && typeof node.value === "number" ? node.value : 0))
	)
	return {
		focusedNodeId: focused?.id ?? null,
		nodes: root
			.descendants()
			.filter((node) => node.depth > 0 && (node.value ?? 0) > 0)
			.map((node) => ({
				id: node.data.id,
				label: node.data.label,
				value: node.value ?? 0,
				x: node.x0,
				y: node.y0,
				width: node.x1 - node.x0,
				height: node.y1 - node.y0,
				branchId: focused
					? focused.id
					: node.depth === 1
						? node.data.id
						: (node.parent?.data.id ?? data.id),
			})),
	}
}

export function Treemap({
	data,
	ariaLabel,
	className,
	nodeTones,
	focusedNodeId,
	onFocusChange,
	onLeafActivate,
}: TreemapProps) {
	const containerRef = useRef<HTMLDivElement>(null)
	const [size, setSize] = useState({ width: 0, height: 0 })

	useEffect(() => {
		const element = containerRef.current
		if (!element) return
		const update = () => setSize({ width: element.clientWidth, height: element.clientHeight })
		update()
		const observer = new ResizeObserver(update)
		observer.observe(element)
		return () => observer.disconnect()
	}, [])

	const layout = useMemo(() => {
		try {
			return computeTreemapLayout(data, size.width, size.height, focusedNodeId)
		} catch (error) {
			if (process.env.NODE_ENV !== "production") console.error(error)
			return { nodes: [] as LayoutNode[], focusedNodeId: null }
		}
	}, [data, size, focusedNodeId])
	const branches = "children" in data && Array.isArray(data.children) ? data.children : []
	const toneByBranch = new Map(
		branches.map((branch, index) => [
			branch.id,
			nodeTones?.[branch.id] ?? (`chart-${(index % 5) + 1}` as TreemapTone),
		])
	)

	return (
		<div
			ref={containerRef}
			role="group"
			aria-label={ariaLabel}
			className={`relative h-[320px] w-full overflow-hidden rounded-xl md:h-[420px] ${className ?? ""}`}
		>
			{layout.nodes.map((node) => {
				const isBranch = branches.some((branch) => branch.id === node.id)
				const tone = toneByBranch.get(node.branchId) ?? "chart-1"
				const canActivate =
					node.width >= 44 &&
					node.height >= 44 &&
					(isBranch ? Boolean(onFocusChange) : Boolean(onLeafActivate))
				const showLabel = node.width >= 72 && node.height >= 32
				const style = {
					left: node.x,
					top: node.y,
					width: node.width,
					height: node.height,
					background: `color-mix(in srgb, var(--${tone}) ${isBranch ? 10 : 20}%, var(--card))`,
					borderColor: `var(--${tone})`,
				} as const
				const content = showLabel ? (
					<span
						className={cn(
							"line-clamp-2 break-words text-left text-xs font-medium text-foreground",
							isBranch && "absolute inset-x-1.5 top-1.5"
						)}
					>
						{node.label}
					</span>
				) : null
				return canActivate ? (
					<button
						key={node.id}
						type="button"
						title={`${node.label}: ${node.value}`}
						aria-label={`${node.label}: ${node.value}`}
						onClick={() => (isBranch ? onFocusChange?.(node.id) : onLeafActivate?.(node.id))}
						className="absolute overflow-hidden rounded-md border p-1.5 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
						style={style}
					>
						{content}
					</button>
				) : (
					<div
						key={node.id}
						title={`${node.label}: ${node.value}`}
						aria-hidden="true"
						className="absolute overflow-hidden rounded-md border p-1.5"
						style={style}
					>
						{content}
					</div>
				)
			})}
		</div>
	)
}
