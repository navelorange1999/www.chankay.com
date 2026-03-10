import type { MetadataRoute } from "next"

import { getAllPages } from "@/services/payload/pages"
import { getSiteConfig } from "@/services/payload/site-config"
import { resolvePageAbsoluteUrl } from "@/utils/seo"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const [siteConfig, pages] = await Promise.all([getSiteConfig(), getAllPages()])

	return pages
		.filter((page) => Boolean(page.slug))
		.map((page) => ({
			lastModified: page.updatedAt,
			url: resolvePageAbsoluteUrl(siteConfig, page.slug),
		}))
}
