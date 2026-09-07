import type { Field } from "payload"
import { describe, expect, it, vi } from "vitest"

vi.mock("../../hooks/revalidateWww", () => ({
	createRevalidationHook: vi.fn(() => vi.fn()),
}))

import { Posts } from "../Posts"

const findField = (fields: Field[], fieldName: string): Field | undefined => {
	for (const field of fields) {
		if ("name" in field && field.name === fieldName) return field

		if ("fields" in field && Array.isArray(field.fields)) {
			const nestedField = findField(field.fields, fieldName)
			if (nestedField) return nestedField
		}
	}

	return undefined
}

describe("post reading time", () => {
	it("derives reading time from locale-resolved content after read", async () => {
		const readingTime = findField(Posts.fields, "readingTime")

		expect(readingTime).toMatchObject({
			name: "readingTime",
			type: "number",
			virtual: true,
		})

		if (!readingTime || !("hooks" in readingTime)) {
			throw new Error("Expected the readingTime field to define field hooks")
		}

		expect(readingTime.hooks?.beforeChange).toBeUndefined()

		const afterRead = readingTime.hooks?.afterRead?.[0]
		expect(afterRead).toBeTypeOf("function")
		if (!afterRead) throw new Error("Expected the readingTime field to define an afterRead hook")

		expect(await afterRead({ siblingData: { content: "猪".repeat(800) } } as never)).toBe(2)
		expect(
			await afterRead({
				siblingData: {
					content: Array.from({ length: 400 }, (_, index) => `word${index}`).join(" "),
				},
			} as never)
		).toBe(2)
	})
})
