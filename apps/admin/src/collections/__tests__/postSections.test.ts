import { describe, expect, it, vi } from "vitest"

const {
	basicTranslationHook,
	createBasicTranslationHookMock,
	createRevalidationHookMock,
	tagsRevalidationHook,
} = vi.hoisted(() => {
	const basicTranslationHook = vi.fn()
	const postsRevalidationHook = vi.fn()
	const tagsRevalidationHook = vi.fn()

	return {
		basicTranslationHook,
		createBasicTranslationHookMock: vi.fn(() => basicTranslationHook),
		createRevalidationHookMock: vi.fn((collection: string) =>
			collection === "tags" ? tagsRevalidationHook : postsRevalidationHook
		),
		tagsRevalidationHook,
	}
})

vi.mock("../../hooks/createTranslationHook", () => ({
	createBasicTranslationHook: createBasicTranslationHookMock,
}))

vi.mock("../../hooks/revalidateWww", () => ({
	createRevalidationHook: createRevalidationHookMock,
}))

import { Posts } from "../Posts"
import { Tags } from "../Tags"

describe("post section contract", () => {
	it("requires a primary tag relationship", () => {
		const primaryTag = Posts.fields.find((field) => "name" in field && field.name === "primaryTag")

		expect(primaryTag).toMatchObject({
			name: "primaryTag",
			relationTo: "tags",
			required: true,
			type: "relationship",
			admin: {
				position: "sidebar",
				description:
					"Required. Determines whether the post appears in the Technical or Trading section.",
			},
		})
	})

	it("validates post slugs as safe URL path segments", () => {
		const slug = Posts.fields.find((field) => "name" in field && field.name === "slug")

		expect(slug).toMatchObject({
			name: "slug",
			required: true,
			unique: true,
			admin: {
				position: "sidebar",
				description: "URL-friendly version of the title",
			},
		})
		expect("validate" in slug! && slug.validate?.("market-view-2026", {} as never)).toBe(true)
		expect("validate" in slug! && slug.validate?.("../private", {} as never)).toMatch(
			/safe URL path segment/i
		)
	})

	it("preserves translation and revalidation hooks for tags", () => {
		expect(Tags.hooks?.beforeChange).toHaveLength(1)
		expect(Tags.hooks?.beforeChange?.[0]).toBe(basicTranslationHook)
		expect(createBasicTranslationHookMock).toHaveBeenCalledTimes(1)

		expect(Tags.hooks?.afterChange).toHaveLength(1)
		expect(Tags.hooks?.afterChange?.[0]).toBe(tagsRevalidationHook)
		expect(createRevalidationHookMock).toHaveBeenCalledWith("tags")
	})
})
