import { describe, expect, it } from "vitest"

import { transformAnimationDurations } from "../20260928120000_animation_duration"

describe("animation duration migration", () => {
	it("preserves database value instances in unrelated fields", () => {
		class DatabaseId {}
		const media = new DatabaseId()
		const result = transformAnimationDurations(
			[
				{ blockType: "image", image: media },
				{ blockType: "handWriting", speed: 1 },
			],
			true
		)
		expect((result.structure as Array<{ image?: DatabaseId }>)[0]!.image).toBe(media)
	})

	it("converts nested legacy settings without mutating the original structure", () => {
		const structure = [
			{
				blockType: "flex",
				children: [
					{ blockType: "handWriting", speed: 2 },
					{ blockType: "heatmap", display: { animateFill: 4, size: "sm" } },
				],
			},
		]
		const result = transformAnimationDurations(structure, true)
		expect(result.changed).toBe(true)
		expect(result.structure).toEqual([
			{
				blockType: "flex",
				children: [
					{ blockType: "handWriting", speed: 2, duration: 3.75 },
					{ blockType: "heatmap", display: { animateFill: 4, duration: 4, size: "sm" } },
				],
			},
		])
		expect(structure[0]!.children[0]).not.toHaveProperty("duration")
		expect(transformAnimationDurations(result.structure, true).changed).toBe(false)
	})

	it("preserves explicit durations and leaves non-animated heatmaps unchanged", () => {
		const structure = [
			{ blockType: "handWriting", speed: 2, duration: 8 },
			{ blockType: "heatmap", display: { animateFill: 3, duration: null } },
			{ blockType: "heatmap", display: { size: "md" } },
		]
		expect(transformAnimationDurations(structure, true)).toEqual({ changed: false, structure })
	})

	it("converts all page-builder child slots and skips unrelated custom JSON", () => {
		const child = { blockType: "handWriting" }
		const result = transformAnimationDurations(
			[
				{
					blockType: "card",
					actionBlocks: [child],
					contentBlocks: [child],
					footerBlocks: [child],
					custom: { blockType: "handWriting", speed: 2 },
				},
			],
			true
		)
		expect(result.structure).toEqual([
			{
				blockType: "card",
				actionBlocks: [{ ...child, duration: 7.5 }],
				contentBlocks: [{ ...child, duration: 7.5 }],
				footerBlocks: [{ ...child, duration: 7.5 }],
				custom: { blockType: "handWriting", speed: 2 },
			},
		])
	})

	it("maps invalid legacy values to safe behavior", () => {
		const result = transformAnimationDurations(
			[
				{ blockType: "handWriting", speed: 0 },
				{ blockType: "heatmap", display: { animateFill: -1 } },
			],
			true
		)
		expect(result.structure).toEqual([
			{ blockType: "handWriting", speed: 0, duration: 7.5 },
			{ blockType: "heatmap", display: { animateFill: -1 } },
		])
	})

	it("can roll back migrated and newly configured blocks", () => {
		const original = [
			{ blockType: "handWriting", speed: 2 },
			{ blockType: "heatmap", display: { animateFill: 3 } },
		]
		const migrated = transformAnimationDurations(original, true)
		expect(transformAnimationDurations(migrated.structure, false).structure).toEqual(original)
		const rollback = transformAnimationDurations(
			[
				{ blockType: "handWriting", duration: 5 },
				{ blockType: "heatmap", display: { duration: 5 } },
			],
			false
		)
		expect(rollback.structure).toEqual([
			{ blockType: "handWriting", speed: 1.5 },
			{ blockType: "heatmap", display: { animateFill: 5 } },
		])
		expect(transformAnimationDurations(rollback.structure, false).changed).toBe(false)
	})
})
