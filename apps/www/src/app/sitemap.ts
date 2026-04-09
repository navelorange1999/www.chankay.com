import type { MetadataRoute } from "next"

import { getAllPages } from "@/services/payload/pages"
import { getAllPosts } from "@/services/payload/posts"
import { getSiteConfig } from "@/services/payload/site-config"
import { resolvePageAbsoluteUrl } from "@/utils/seo"
import { resolvePostAbsoluteUrl } from "@/utils/posts"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const [siteConfig, pages, posts] = await Promise.all([
		getSiteConfig(),
		getAllPages(),
		getAllPosts(),
	])

	const pageEntries = pages
		.filter((page) => Boolean(page.slug))
		.map((page) => ({
			lastModified: page.updatedAt,
			url: resolvePageAbsoluteUrl(siteConfig, page.slug),
		}))

	const postEntries = posts
		.filter((post) => Boolean(post.slug))
		.map((post) => ({
			lastModified: post.updatedAt,
			url: resolvePostAbsoluteUrl(siteConfig, post.slug),
		}))

	return [...pageEntries, ...postEntries]
}
