import { describe, expect, it } from "vitest"

import { Posts } from "../Posts"
import { POST_SLUG_MAX_LENGTH } from "@repo/i18n"

describe("post section contract", () => {
	function getBeforeValidateHook(collection: typeof Posts) {
		const slug = collection.fields.find((field) => "name" in field && field.name === "slug")

		if (!slug || !("hooks" in slug) || !slug.hooks?.beforeValidate?.[0]) {
			throw new Error("Expected the slug field to define a beforeValidate hook")
		}

		return slug.hooks.beforeValidate[0]
	}

	it.each([["post", Posts, "title", "Existing Post Slug"]] as const)(
		"preserves an existing %s slug during a partial update",
		(_name, collection, sourceField, slug) => {
			const beforeValidate = getBeforeValidateHook(collection)

			expect(
				beforeValidate({
					data: { id: "document-id", [sourceField]: "A replacement title" },
					originalDoc: { slug },
				} as never)
			).toBe(slug)
		}
	)

	it.each([["post", Posts, "title", "New Post Title", "new-post-title"]] as const)(
		"derives a %s slug on create when no slug is supplied",
		(_name, collection, sourceField, source, expected) => {
			const beforeValidate = getBeforeValidateHook(collection)

			expect(beforeValidate({ data: { [sourceField]: source } } as never)).toBe(expected)
		}
	)

	it.each([["post", Posts, "title"]] as const)(
		"preserves an explicitly supplied %s slug",
		(_name, collection, sourceField) => {
			const beforeValidate = getBeforeValidateHook(collection)

			expect(
				beforeValidate({
					data: { [sourceField]: "A replacement title", slug: "editorial-slug" },
					originalDoc: { slug: "existing-slug" },
				} as never)
			).toBe("editorial-slug")
		}
	)

	it.each([
		["post", Posts, "title", ""],
		["post", Posts, "title", null],
	] as const)(
		"returns an explicit invalid %s slug unchanged",
		(_name, collection, sourceField, slug) => {
			const beforeValidate = getBeforeValidateHook(collection)

			expect(
				beforeValidate({
					data: { [sourceField]: "A replacement title", slug },
					originalDoc: { slug: "existing-slug" },
				} as never)
			).toBe(slug)
		}
	)

	it("uses Category without a legacy primary tag relationship", () => {
		expect(
			Posts.fields.find((field) => "name" in field && field.name === "primaryTag")
		).toBeUndefined()
		expect(
			Posts.fields.find((field) => "name" in field && field.name === "category")
		).toMatchObject({ relationTo: "categories" })
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
})
