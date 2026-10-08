import { describe, expect, it } from "vitest"

import { planPostTaxonomy } from "../plan"

const map = { classification: "technical", trading: "trading" }

describe("planPostTaxonomy", () => {
	it("uses an approved primary mapping and preserves other topic tags", () => {
		expect(planPostTaxonomy({ id: "p", category: null, primaryTag: "classification", tags: ["classification", "react"] }, map)).toMatchObject({
			category: "technical", tags: ["react"], changed: true,
		})
	})

	it("preserves an unmapped primary Tag even when it was missing from tags", () => {
		expect(planPostTaxonomy({ id: "p", category: null, primaryTag: "notes", tags: ["react"] }, map)).toMatchObject({
			category: null, tags: ["react", "notes"], changed: true,
		})
	})

	it("does not guess between conflicting Categories or overwrite an editorial choice", () => {
		expect(planPostTaxonomy({ id: "p", category: null, primaryTag: null, tags: ["classification", "trading"] }, map).reviewReason).toBeTruthy()
		expect(planPostTaxonomy({ id: "p", category: "trading", primaryTag: "classification", tags: ["react"] }, map).reviewReason).toBeTruthy()
	})

	it("is idempotent after classification tags have been converted", () => {
		const first = planPostTaxonomy({ id: "p", category: null, primaryTag: "classification", tags: ["classification", "react"] }, map)
		const second = planPostTaxonomy({ id: "p", category: first.category, primaryTag: "classification", tags: first.tags }, map)
		expect(second.changed).toBe(false)
	})
})
