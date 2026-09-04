import { describe, expect, it, vi } from "vitest"

const {
	basicTranslationHook,
	createBasicTranslationHookMock,
	createRevalidationDeleteHookMock,
	createRevalidationHookMock,
	tagsDeleteRevalidationHook,
	tagsRevalidationHook,
} = vi.hoisted(() => {
	const basicTranslationHook = vi.fn()
	const postsRevalidationHook = vi.fn()
	const tagsRevalidationHook = vi.fn()
	const tagsDeleteRevalidationHook = vi.fn()

	return {
		basicTranslationHook,
		createBasicTranslationHookMock: vi.fn(() => basicTranslationHook),
		createRevalidationDeleteHookMock: vi.fn((collection: string) =>
			collection === "tags" ? tagsDeleteRevalidationHook : postsRevalidationHook
		),
		createRevalidationHookMock: vi.fn((collection: string) =>
			collection === "tags" ? tagsRevalidationHook : postsRevalidationHook
		),
		tagsDeleteRevalidationHook,
		tagsRevalidationHook,
	}
})

vi.mock("../../hooks/createTranslationHook", () => ({
	createBasicTranslationHook: createBasicTranslationHookMock,
}))

vi.mock("../../hooks/revalidateWww", () => ({
	createRevalidationDeleteHook: createRevalidationDeleteHookMock,
	createRevalidationHook: createRevalidationHookMock,
}))

import { Posts } from "../Posts"
import { Tags } from "../Tags"
import { POST_SLUG_MAX_LENGTH } from "@repo/i18n"

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
			maxLength: POST_SLUG_MAX_LENGTH,
			admin: {
				position: "sidebar",
				description: "URL-friendly version of the title",
			},
		})
		expect("validate" in slug! && slug.validate?.("market-view-2026", {} as never)).toBe(true)
		expect(
			"validate" in slug! && slug.validate?.("a".repeat(POST_SLUG_MAX_LENGTH), {} as never)
		).toBe(true)
		expect(
			"validate" in slug! && slug.validate?.("a".repeat(POST_SLUG_MAX_LENGTH + 1), {} as never)
		).toMatch(/safe URL path segment/i)
		expect("validate" in slug! && slug.validate?.("../private", {} as never)).toMatch(
			/safe URL path segment/i
		)
	})

	it("describes tags as optional secondary topics", () => {
		const tags = Posts.fields.find((field) => "name" in field && field.name === "tags")

		expect(tags).toMatchObject({
			name: "tags",
			admin: {
				description:
					"Optional secondary topics. Primary Tag determines the Technical or Trading section.",
			},
		})
	})

	it("preserves translation and revalidation hooks for tags", () => {
		expect(Tags.hooks?.beforeChange).toHaveLength(1)
		expect(Tags.hooks?.beforeChange?.[0]).toBe(basicTranslationHook)
		expect(createBasicTranslationHookMock).toHaveBeenCalledTimes(1)

		expect(Tags.hooks?.afterChange).toHaveLength(1)
		expect(Tags.hooks?.afterChange?.[0]).toBe(tagsRevalidationHook)
		expect(createRevalidationHookMock).toHaveBeenCalledWith("tags")

		expect(Tags.hooks?.afterDelete).toHaveLength(1)
		expect(Tags.hooks?.afterDelete?.[0]).toBe(tagsDeleteRevalidationHook)
		expect(createRevalidationDeleteHookMock).toHaveBeenCalledWith("tags")
	})
})
