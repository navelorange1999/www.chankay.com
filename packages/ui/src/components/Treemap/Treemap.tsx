"use client"

import { hierarchy, treemap } from "d3-hierarchy"
import { useEffect, useMemo, useRef, useState } from "react"

export type TreemapNode =
	| { id: string; label: string; value: number; children?: never }
	| { id: string; label: string; children: readonly TreemapNode[]; value?: never }

export type TreemapTone = "chart-1" | "chart-2" | "chart-3" | "chart-4" | "chart-5"

export type TreemapProps = {
	data: TreemapNode
	ariaLabel: string
	backLabel?: string
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
	backLabel = data.label,
	className,
	nodeTones,
	focusedNodeId,
	onFocusChange,
	onLeafActivate,
}: TreemapProps) {
	const containerRef = useRef<HTMLDivElement>(null)
	const backRef = useRef<HTMLButtonElement>(null)
	const branchButtons = useRef(new Map<string, HTMLButtonElement>())
	const pendingFocus = useRef<{ branchId: string | null } | null>(null)
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

	const contentHeight = useMemo(() => {
		if (size.width <= 0) return 0
		const branches = "children" in data ? (data.children ?? []) : []
		const focused = branches.find((branch) => branch.id === focusedNodeId && "children" in branch)
		const visible = focused ?? data
		const leaves = hierarchy(visible, (node) =>
			"children" in node ? node.children : undefined
		).leaves().length
		const headerArea = focused ? 0 : branches.length * 96 * 44
		return Math.ceil((leaves * 96 * 64 + headerArea) / size.width) + (focused ? 44 : 0)
	}, [data, size.width, focusedNodeId])

	const minHeight = Math.min(contentHeight, 720)

	const layout = useMemo(() => {
		try {
			const computed = computeTreemapLayout(
				data,
				size.width,
				Math.max(size.height, focusedNodeId ? contentHeight : minHeight) - (focusedNodeId ? 44 : 0),
				focusedNodeId
			)
			const needsCategoryOverview =
				!computed.focusedNodeId &&
				Boolean(onFocusChange) &&
				computed.nodes.some((node) =>
					node.id === node.branchId
						? node.height < 44 || node.width < 44
						: node.height < 24 || node.width < 24
				)
			if (!needsCategoryOverview) return { ...computed, categoryOverview: false }
			const categories = computed.nodes.filter((node) => node.id === node.branchId)
			const columns = Math.max(1, Math.floor(size.width / 180))
			const tileWidth = (size.width - 6) / columns
			return {
				...computed,
				categoryOverview: true,
				nodes: categories.map((node, index) => ({
					...node,
					x: 3 + (index % columns) * tileWidth,
					y: 3 + Math.floor(index / columns) * 52,
					width: tileWidth - 3,
					height: 44,
				})),
			}
		} catch (error) {
			if (process.env.NODE_ENV !== "production") console.error(error)
			return {
				nodes: [] as LayoutNode[],
				focusedNodeId: null,
				categoryOverview: false,
			}
		}
	}, [data, size, focusedNodeId, minHeight, contentHeight, onFocusChange])
	const branches = "children" in data && Array.isArray(data.children) ? data.children : []
	const toneByBranch = new Map(
		branches.map((branch, index) => [
			branch.id,
			nodeTones?.[branch.id] ?? (`chart-${(index % 5) + 1}` as TreemapTone),
		])
	)

	useEffect(() => {
		if (!pendingFocus.current) return
		const target = pendingFocus.current.branchId
		if (target === null && layout.focusedNodeId) backRef.current?.focus()
		else if (target && !layout.focusedNodeId) branchButtons.current.get(target)?.focus()
		else return
		pendingFocus.current = null
	}, [layout.focusedNodeId])

	const activeBranch = branches.find((branch) => branch.id === layout.focusedNodeId)
	const interactiveClass =
		"cursor-pointer motion-safe:transition-transform motion-safe:duration-150 motion-safe:hover:scale-[1.015] hover:z-10 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
	return (
		<div
			ref={containerRef}
			role="group"
			aria-label={ariaLabel}
			data-treemap-overview={layout.categoryOverview ? "categories" : "nested"}
			style={{
				minHeight: layout.categoryOverview
					? Math.min(720, Math.max(104, layout.nodes.length * 52 + 6))
					: minHeight,
			}}
			className={`relative h-[320px] w-full overflow-x-hidden overflow-y-auto rounded-xl md:h-[420px] ${className ?? ""}`}
		>
			{activeBranch && (
				<button
					type="button"
					data-treemap-back=""
					ref={backRef}
					onClick={() => {
						pendingFocus.current = { branchId: activeBranch.id }
						onFocusChange?.(null)
					}}
					className={`sticky inset-x-0 top-0 z-20 flex h-11 w-full items-center gap-2 rounded-md bg-card px-3 text-sm ${interactiveClass}`}
				>
					<span aria-hidden="true">←</span>
					<span>{backLabel}</span>
					<span aria-hidden="true">/</span>
					<span className="truncate">{activeBranch.label}</span>
					<span className="ml-auto tabular-nums">
						{layout.nodes.reduce((sum, node) => sum + node.value, 0)}
					</span>
				</button>
			)}
			{layout.nodes.map((node) => {
				const isBranch = branches.some((branch) => branch.id === node.id)
				const tone = toneByBranch.get(node.branchId) ?? "chart-1"
				const canActivate = isBranch ? Boolean(onFocusChange) : Boolean(onLeafActivate)
				const showLabel = node.width >= 72 && node.height >= 32
				const style = {
					left: node.x,
					top: node.y + (activeBranch ? 44 : 0),
					width: node.width,
					height: node.height,
					background: `color-mix(in srgb, var(--${tone}) ${isBranch ? 10 : 20}%, var(--card))`,
					borderColor: `var(--${tone})`,
				} as const
				const content = (
					<span className="flex w-full items-start justify-center gap-2 text-left text-xs font-medium text-foreground">
						{showLabel && (
							<span className="line-clamp-2 min-w-0 flex-1 break-words">{node.label}</span>
						)}
						<span data-treemap-count="" className="shrink-0 tabular-nums">
							{node.value}
						</span>
					</span>
				)
				const label = `${node.label}: ${node.value}`
				if (isBranch)
					return (
						<div key={node.id}>
							<div
								aria-hidden="true"
								className="pointer-events-none absolute rounded-md border"
								style={style}
							/>
							{canActivate ? (
								<button
									type="button"
									title={label}
									aria-label={label}
									ref={(element) => {
										if (element) branchButtons.current.set(node.id, element)
										else branchButtons.current.delete(node.id)
									}}
									onClick={() => {
										pendingFocus.current = { branchId: null }
										onFocusChange?.(node.id)
									}}
									className={`absolute flex items-center overflow-hidden rounded-md px-2 text-left ${interactiveClass}`}
									style={{ ...style, height: 44 }}
								>
									{content}
								</button>
							) : (
								<div
									data-treemap-category={node.id}
									aria-label={label}
									className="absolute overflow-hidden p-1.5"
									style={{ ...style, height: Math.min(44, node.height) }}
								>
									{content}
								</div>
							)}
						</div>
					)
				return canActivate ? (
					<button
						key={node.id}
						type="button"
						title={label}
						aria-label={label}
						onClick={() => onLeafActivate?.(node.id)}
						className={`absolute overflow-hidden rounded-md border p-1.5 text-left ${interactiveClass}`}
						style={style}
					>
						{content}
					</button>
				) : (
					<div
						key={node.id}
						title={label}
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
