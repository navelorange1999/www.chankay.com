import { describe, expect, it } from "vitest"
import type { SiteConfig } from "@repo/typescript-config/typings/payload-types"

import { resolveSiteName, resolveSiteTitle } from "@/utils/seo"

const config = {
	siteName: "Example Blog",
	metaTitle: "A complete homepage title",
} as SiteConfig

describe("CMS site identity", () => {
	it("keeps the site name separate from the default SEO title", () => {
		expect(resolveSiteName(config)).toBe("Example Blog")
	})

	it("uses the configured default title without changing the brand name", () => {
		expect(resolveSiteTitle(config)).toBe("A complete homepage title")
		expect(resolveSiteTitle({ ...config, metaTitle: "  " })).toBe("Example Blog")
	})
})
