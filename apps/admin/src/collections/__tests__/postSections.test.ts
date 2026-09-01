import { describe, expect, it } from "vitest"
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
		})
	})

	it("revalidates the public site after tags change", () => {
		expect(Tags.hooks?.afterChange).toHaveLength(1)
	})
})
