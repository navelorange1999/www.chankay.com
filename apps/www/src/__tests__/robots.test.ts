import { describe, expect, it, vi } from "vitest"

const { getSiteConfig } = vi.hoisted(() => ({ getSiteConfig: vi.fn() }))
vi.mock("@/services/payload/site-config", () => ({ getSiteConfig }))

import { GET } from "@/app/robots.txt/route"

describe("CMS robots.txt", () => {
	it("advertises the configured sitemap and excludes localized previews", async () => {
		getSiteConfig.mockResolvedValue({
			siteUrl: "https://blog.example.org",
			robotsSettings: { allowIndexing: true },
		})
		const response = await GET()
		const body = await response.text()
		expect(response.headers.get("Content-Type")).toContain("text/plain")
		expect(body).toContain("User-agent: *\nAllow: /")
		expect(body).toContain("Disallow: /_preview/")
		expect(body).toContain("Disallow: /zh-CN/_preview/")
		expect(body).toContain("Disallow: /en/_preview/")
		expect(body).toContain("Sitemap: https://blog.example.org/sitemap.xml")
	})

	it("uses CMS crawler rules while replacing stale sitemap URLs", async () => {
		getSiteConfig.mockResolvedValue({
			siteUrl: "https://blog.example.org",
			robotsSettings: {
				customRobotsTxt:
					"User-agent: *\nDisallow: /private/\nSitemap: https://old.example.org/sitemap.xml",
			},
		})
		const body = await (await GET()).text()
		expect(body).toContain("Disallow: /private/")
		expect(body).not.toContain("old.example.org")
		expect(body.match(/^Sitemap:/gm)).toHaveLength(1)
		expect(body).toContain("Sitemap: https://blog.example.org/sitemap.xml")
	})
})
