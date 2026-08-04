import { describe, expect, it } from "vitest"

import { mcpCollections } from "../collections"

describe("mcpCollections", () => {
	it("enables CRUD for editorial collections", () => {
		const adminMcpAccess = {
			find: true,
			create: true,
			update: true,
			delete: true,
		}

		expect(mcpCollections.posts.enabled).toEqual(adminMcpAccess)
		expect(mcpCollections.pages.enabled).toEqual(adminMcpAccess)
		expect(mcpCollections.tags.enabled).toEqual(adminMcpAccess)
		expect(mcpCollections.series.enabled).toEqual(adminMcpAccess)
	})

	it("keeps media read-only", () => {
		expect(mcpCollections.media.enabled).toEqual({
			find: true,
			create: false,
			update: false,
			delete: false,
		})
	})
})
