import { afterEach, describe, expect, it, vi } from "vitest"

import { createPublishedOrAuthenticated } from "@/access/publishedOrAuthenticated"
import { getPublicationWhere, isLegacyPublicationRecord, mirrorNativePublication } from "../index"

const cutoff = "2026-10-08T00:00:00.000Z"
afterEach(() => vi.unstubAllEnvs())

function enable() {
	vi.stubEnv("CONTENT_PUBLICATION_MODE", "compatibility")
	vi.stubEnv("CONTENT_PUBLICATION_LEGACY_BEFORE", cutoff)
}

describe("publication compatibility boundary", () => {
	it("defaults to strict access and rejects missing or invalid cutoff configuration", () => {
		for (const value of ["", "invalid", "2026-02-30T00:00:00.000Z"]) {
			vi.stubEnv("CONTENT_PUBLICATION_MODE", "compatibility")
			vi.stubEnv("CONTENT_PUBLICATION_LEGACY_BEFORE", value)
			expect(getPublicationWhere("tags")).toEqual({ _status: { equals: "published" } })
		}
		vi.stubEnv("CONTENT_PUBLICATION_MODE", "strict")
		vi.stubEnv("CONTENT_PUBLICATION_LEGACY_BEFORE", cutoff)
		expect(getPublicationWhere("pages")).toEqual({ _status: { equals: "published" } })
	})

	it("only falls back for old records with no stored native state", () => {
		enable()
		for (const collection of ["posts", "pages"] as const) {
			expect(getPublicationWhere(collection)).toEqual({
				or: [
					{ _status: { equals: "published" } },
					{
						and: [
							{ _status: { exists: false } },
							{ createdAt: { less_than: cutoff } },
							{ status: { equals: "published" } },
						],
					},
				],
			})
		}
		for (const collection of ["tags", "series", "media"] as const) {
			expect(getPublicationWhere(collection)).toEqual({
				or: [
					{ _status: { equals: "published" } },
					{ and: [{ _status: { exists: false } }, { createdAt: { less_than: cutoff } }] },
				],
			})
		}
		expect(getPublicationWhere("categories")).toEqual({ _status: { equals: "published" } })
	})

	it("retains authenticated editing access without relaxing anonymous version access", () => {
		enable()
		const read = createPublishedOrAuthenticated("pages")
		expect(read({ req: { user: { id: "editor" } } } as never)).toBe(true)
		expect(read({ req: { user: null } } as never)).toEqual(getPublicationWhere("pages"))
	})

	it("requires a valid pre-cutoff creation time for legacy validation allowances", () => {
		enable()
		expect(isLegacyPublicationRecord({ createdAt: "2020-01-01T00:00:00.000Z" })).toBe(true)
		for (const createdAt of [undefined, "invalid", cutoff, "2027-01-01T00:00:00.000Z"]) {
			expect(isLegacyPublicationRecord({ createdAt })).toBe(false)
		}
	})
})

describe("one-way publication mirror", () => {
	it("mirrors native publish and unpublish instead of accepting a contradictory legacy field", () => {
		enable()
		for (const _status of ["draft", "published"] as const) {
			const result = mirrorNativePublication({
				data: { _status, status: _status === "draft" ? "published" : "draft" },
				originalDoc: { _status: "published", status: "published" },
			} as never)
			expect(result.status).toBe(_status)
		}
	})

	it("only changes the pending write, allowing Payload draft saves to leave the main record untouched", () => {
		enable()
		const originalDoc = { _status: "published", status: "published" }
		const result = mirrorNativePublication({ data: { _status: "draft" }, originalDoc } as never)
		expect(result).toEqual({ _status: "draft", status: "draft" })
		expect(originalDoc).toEqual({ _status: "published", status: "published" })
	})

	it("preserves old status for legacy-only updates and makes ordinary new drafts private", () => {
		enable()
		expect(
			mirrorNativePublication({
				data: { title: "Updated", status: "draft" },
				originalDoc: { status: "published" },
			} as never)
		).toEqual({ title: "Updated", status: "published" })
		expect(
			mirrorNativePublication({ data: { status: "published" }, operation: "create" } as never)
		).toEqual({ status: "draft" })
	})

	it("does not change stored legacy fields in strict mode", () => {
		vi.stubEnv("CONTENT_PUBLICATION_MODE", "strict")
		const data = { _status: "published", status: "draft" }
		expect(mirrorNativePublication({ data } as never)).toBe(data)
	})
})
