import { describe, expect, it } from "vitest"

import { computeTreemapLayout, type TreemapNode } from "@repo/ui/components/Treemap"

const tree: TreemapNode = {
	id: "root",
	label: "Topics",
	children: [
		{
			id: "technical",
			label: "Technical",
			children: [
				{ id: "react", label: "React", value: 3 },
				{ id: "typescript", label: "TypeScript", value: 1 },
			],
		},
		{ id: "trading", label: "Trading", children: [{ id: "risk", label: "Risk", value: 2 }] },
	],
}

describe("generic Treemap layout", () => {
	it("uses only leaf values and focuses a branch without changing its total", () => {
		const overview = computeTreemapLayout(tree, 600, 420)
		expect(overview.nodes.find((node) => node.id === "technical")?.value).toBe(4)
		const focused = computeTreemapLayout(tree, 600, 420, "technical")
		expect(focused.focusedNodeId).toBe("technical")
		expect(focused.nodes.map((node) => node.id)).toEqual(["react", "typescript"])
		expect(focused.nodes.reduce((sum, node) => sum + node.value, 0)).toBe(4)
	})

	it.each([320, 375, 768, 1024, 1440])(
		"keeps category headers clear of leaves with a 44px touch area at %ipx",
		(width) => {
			const overview = computeTreemapLayout(tree, width, 320)
			const branches = overview.nodes.filter((node) => node.id === node.branchId)
			expect(Math.min(...branches.map((node) => node.y))).toBe(3)
			for (const branch of branches) {
				const leaves = overview.nodes.filter(
					(node) => node.branchId === branch.id && node.id !== branch.id
				)
				expect(leaves.length).toBeGreaterThan(0)
				expect(Math.min(...leaves.map((node) => node.y)) - branch.y).toBeGreaterThanOrEqual(44)
				for (const leaf of leaves) {
					expect(leaf.y + leaf.height).toBeLessThanOrEqual(branch.y + branch.height)
				}
			}
			const focused = computeTreemapLayout(tree, width, 320, "technical")
			expect(Math.min(...focused.nodes.map((node) => node.y))).toBe(3)
		}
	)

	it("falls back from an unknown focus and handles invalid data without drawing", () => {
		expect(computeTreemapLayout(tree, 375, 320, "missing").focusedNodeId).toBeNull()
		expect(computeTreemapLayout(tree, 0, 320).nodes).toEqual([])
		expect(() =>
			computeTreemapLayout(
				{
					id: "x",
					label: "X",
					children: [
						{ id: "same", label: "A", value: 1 },
						{ id: "same", label: "B", value: 1 },
					],
				},
				375,
				320
			)
		).toThrow("Invalid Treemap node ID")
	})
})
