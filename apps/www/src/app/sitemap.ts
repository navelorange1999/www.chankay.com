import type { MetadataRoute } from "next"

import { getAllPages } from "@/services/payload/pages"
import { getAllPosts } from "@/services/payload/posts"
import { resolvePageAbsoluteUrl } from "@/utils/seo"
import { resolvePostAbsoluteUrl } from "@/utils/posts"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const [pages, posts] = await Promise.all([getAllPages(), getAllPosts()])

	const pageEntries = pages
		.filter((page) => Boolean(page.slug))
		.map((page) => ({
			lastModified: page.updatedAt,
			url: resolvePageAbsoluteUrl(null, page.slug),
		}))

	const postEntries = posts
		.filter((post) => Boolean(post.slug))
		.map((post) => ({
			lastModified: post.updatedAt,
			url: resolvePostAbsoluteUrl(null, post.slug),
		}))

	return [...pageEntries, ...postEntries]
}
