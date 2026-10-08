import { describe, expect, it, vi } from "vitest"

const { page, site } = vi.hoisted(() => ({
	page: {
		title: "Visible page title",
		slug: "/",
		seo: { metaTitle: "Example — Personal Blog", metaDescription: "Personal notes." },
	},
	site: {
		siteName: "Example",
		siteUrl: "https://blog.example.org",
		metaDescription: "Default description",
		ogImage: { _status: "published", url: "https://images.example.org/cover.png" },
	},
}))

vi.mock("@/components/Nodes", () => ({ Nodes: () => null }))
vi.mock("@/services/payload/pages", () => ({
	getAllPages: vi.fn().mockResolvedValue([]),
	getPageBySlug: vi.fn().mockResolvedValue(page),
}))
vi.mock("@/services/payload/site-config", () => ({
	getSiteConfig: vi.fn().mockResolvedValue(site),
}))

import { generateMetadata } from "@/app/[locale]/(frontend)/[[...slug]]/page"

describe("page metadata", () => {
	it("uses the complete homepage title and a single CMS origin for all URLs", async () => {
		const metadata = await generateMetadata({ params: Promise.resolve({ locale: "en" }) })
		expect(metadata.title).toEqual({ absolute: page.seo.metaTitle })
		expect(metadata.description).toBe(page.seo.metaDescription)
		expect(metadata.alternates).toEqual({
			canonical: "https://blog.example.org/",
			languages: {
				en: "https://blog.example.org/",
				"zh-CN": "https://blog.example.org/zh-CN",
				"x-default": "https://blog.example.org/",
			},
		})
		expect(metadata.openGraph).toMatchObject({
			title: page.seo.metaTitle,
			description: page.seo.metaDescription,
			siteName: site.siteName,
			images: [{ url: site.ogImage.url }],
		})
		expect(metadata.twitter).toMatchObject({
			title: page.seo.metaTitle,
			description: page.seo.metaDescription,
		})
	})

	it("uses the localized homepage canonical without changing the title", async () => {
		const metadata = await generateMetadata({ params: Promise.resolve({ locale: "zh-CN" }) })
		expect(metadata.title).toEqual({ absolute: page.seo.metaTitle })
		expect(metadata.alternates?.canonical).toBe("https://blog.example.org/zh-CN")
	})

	it("preserves the existing title template for other pages", async () => {
		const metadata = await generateMetadata({
			params: Promise.resolve({ locale: "en", slug: ["about"] }),
		})
		expect(metadata.title).toBe(page.seo.metaTitle)
	})
})
