import { describe, expect, it } from "vitest"

import { convertPageStructure, countPageStructureNodes } from "../structure"

const getChildren = (node: unknown): Array<Record<string, unknown>> => {
	if (!node || typeof node !== "object" || !("children" in node) || !Array.isArray(node.children)) {
		return []
	}

	return node.children as Array<Record<string, unknown>>
}

describe("MCP page structure transformer", () => {
	it("maps nested structure nodes to depth-specific Payload block types", () => {
		const structure = convertPageStructure([
			{
				children: [
					{
						children: [
							{
								children: [
									{
										children: [
											{
												content: "Hello world",
												type: "text",
											},
										],
										type: "container",
									},
								],
								type: "grid",
							},
						],
						type: "flex",
					},
				],
				type: "container",
			},
		])

		expect(structure[0]?.blockType).toBe("structureContainer1")
		const level2 = getChildren(structure[0])[0]
		const level3 = getChildren(level2)[0]
		const level4 = getChildren(level3)[0]

		expect(level2?.blockType).toBe("structureFlex2")
		expect(level4?.blockType).toBe("structureContainer4")
	})

	it("rejects structure nesting deeper than four layout levels", () => {
		expect(() =>
			convertPageStructure([
				{
					children: [
						{
							children: [
								{
									children: [
										{
											children: [
												{
													children: [],
													type: "flex",
												},
											],
											type: "container",
										},
									],
									type: "grid",
								},
							],
							type: "flex",
						},
					],
					type: "container",
				},
			])
		).toThrow("maximum depth of 4")
	})

	it("counts nested page nodes", () => {
		const count = countPageStructureNodes([
			{
				children: [
					{
						content: "# Title",
						type: "markdown",
					},
					{
						content: "Summary",
						type: "text",
					},
				],
				type: "container",
			},
		])

		expect(count).toBe(3)
	})
})
