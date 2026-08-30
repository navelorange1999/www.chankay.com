import type { SupportedLocale } from "@repo/i18n"
import { DEFAULT_LOCALE } from "@repo/i18n"

import { payloadClient } from "@/utils/payloadClient"
import type { Post } from "@repo/typescript-config/typings/payload-types"

export interface PostListOptions {
	locale?: SupportedLocale
	limit?: number
	page?: number
	depth?: number
	cache?: RequestCache
	revalidate?: number
	sort?: string
}

export async function getPosts(
	options?: PostListOptions
): Promise<{ docs: Post[]; totalDocs: number }> {
	const locale = options?.locale ?? DEFAULT_LOCALE
	try {
		const result = await payloadClient.getCollection<Post>("posts", {
			locale,
			limit: options?.limit ?? 10,
			page: options?.page ?? 1,
			depth: options?.depth,
			sort: options?.sort ?? "-publishedAt",
			revalidate: options?.revalidate,
			cache: options?.cache,
			tags: [`posts:${locale}`],
		})

		return result
	} catch (error) {
		console.error("Error fetching posts:", error)
		return { docs: [], totalDocs: 0 }
	}
}

export async function getPostBySlug(
	slug: string,
	options?: { locale?: SupportedLocale }
): Promise<Post | null> {
	const locale = options?.locale ?? DEFAULT_LOCALE
	try {
		return await payloadClient.getBySlug<Post>("posts", slug, {
			locale,
			depth: 2,
			tags: [`post:${slug}:${locale}`],
		})
	} catch (error) {
		console.error(`Error fetching post ${slug}:`, error)
		return null
	}
}

export async function getAllPosts(options?: { locale?: SupportedLocale }): Promise<Post[]> {
	const locale = options?.locale ?? DEFAULT_LOCALE
	const allPosts: Post[] = []
	const limit = 100
	let page = 1
	let totalDocs = 0

	try {
		do {
			const result = await payloadClient.getCollection<Post>("posts", {
				locale,
				limit,
				page,
				sort: "-publishedAt",
				tags: [`posts:all:${locale}`],
			})

			totalDocs = result.totalDocs
			allPosts.push(...result.docs)
			page += 1
		} while (allPosts.length < totalDocs)

		return allPosts
	} catch (error) {
		console.error("Error fetching all posts:", error)
		return []
	}
}

export async function getLatestPosts(
	limit: number = 5,
	options?: { locale?: SupportedLocale }
): Promise<Post[]> {
	const locale = options?.locale ?? DEFAULT_LOCALE
	try {
		const result = await payloadClient.getCollection<Post>("posts", {
			locale,
			limit,
			sort: "-publishedAt",
			tags: [`posts:latest:${locale}`],
		})

		return result.docs
	} catch (error) {
		console.error("Error fetching latest posts:", error)
		return []
	}
}
