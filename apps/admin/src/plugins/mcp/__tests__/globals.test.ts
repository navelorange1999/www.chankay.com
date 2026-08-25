import { describe, expect, it } from "vitest"

import { mcpGlobals } from "../globals"

describe("mcpGlobals", () => {
	it("enables native find and update capabilities for SiteConfig", () => {
		expect(mcpGlobals["site-config"]).toEqual({
			description: "Global site configuration and localized labels.",
			enabled: {
				find: true,
				update: true,
			},
		})
	})
})
