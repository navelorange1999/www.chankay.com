import type { Field } from "payload"
import { describe, expect, it } from "vitest"

import { SiteConfig } from "../../globals/SiteConfig"

function findField(fields: Field[], name: string): Field | undefined {
	for (const field of fields) {
		if ("name" in field && field.name === name) return field
		if ("fields" in field) {
			const match = findField(field.fields, name)
			if (match) return match
		}
	}
	return undefined
}

describe("CMS author profile", () => {
	it("allows optional public profile URLs and rejects unsafe values", () => {
		const author = findField(SiteConfig.fields, "author")
		if (!author || !("fields" in author)) throw new Error("Missing author fields")
		const url = findField(author.fields, "url")
		if (!url || !("validate" in url) || typeof url.validate !== "function")
			throw new Error("Missing URL validator")
		const validate = url.validate as (value: unknown) => unknown
		expect(validate(undefined)).toBe(true)
		expect(validate("https://profile.example.org/about")).toBe(true)
		expect(validate("javascript:alert(1)")).not.toBe(true)
		expect(validate("/relative-profile")).not.toBe(true)
		expect(validate({ href: "https://profile.example.org" })).not.toBe(true)
	})
})
