import { describe, expect, it } from "vitest"
import { Posts } from "../Posts"
import { validatePostContent } from "../posts/validatePostContent"

describe("Posts content field", () => {
	it("uses the post content validator and H2 authoring guidance", () => {
		const contentField = Posts.fields.find((field) => "name" in field && field.name === "content")

		expect(contentField).toBeDefined()
		if (!contentField || contentField.type !== "textarea")
			throw new Error("content field not found")

		expect(contentField.validate).toBe(validatePostContent)
		expect(contentField.admin?.placeholder).toBe(
			"## Start with a section heading\n\nWrite the article body here."
		)
		expect(contentField.admin?.description).toBe(
			"Main article content written in Markdown. Start sections at H2."
		)
	})
})
