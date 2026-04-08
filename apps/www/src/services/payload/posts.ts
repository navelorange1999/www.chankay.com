import { payloadClient } from "@/utils/payloadClient"
import type { Post } from "@repo/typescript-config/typings/payload-types"

/**
 * Get all posts
 */
export async function getPosts(options?: {
	limit?: number
	page?: number
	depth?: number
	cache?: RequestCache
	revalidate?: number
	sort?: string
}): Promise<{ docs: Post[]; totalDocs: number }> {
	try {
		const result = await payloadClient.getCollection<Post>("posts", {
			limit: options?.limit ?? 10,
			page: options?.page ?? 1,
			depth: options?.depth,
			sort: options?.sort ?? "-publishedAt",
			revalidate: options?.revalidate,
			cache: options?.cache,
			tags: ["posts"],
		})

		return result
	} catch (error) {
		console.error("Error fetching posts:", error)
		return { docs: [], totalDocs: 0 }
	}
}

/**
 * Get post by slug
 */
export async function getPostBySlug(slug: string): Promise<Post | null> {
	try {
		return await payloadClient.getBySlug<Post>("posts", slug, {
			depth: 2,
			tags: [`post:${slug}`],
		})
	} catch (error) {
		console.error(`Error fetching post ${slug}:`, error)
		return null
	}
}

/**
 * Get all posts for sitemap and static params generation
 */
export async function getAllPosts(): Promise<Post[]> {
	const allPosts: Post[] = []
	const limit = 100
	let page = 1
	let totalDocs = 0

	try {
		do {
			const result = await payloadClient.getCollection<Post>("posts", {
				limit,
				page,
				sort: "-publishedAt",
				tags: ["posts:all"],
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

/**
 * Get latest posts
 */
export async function getLatestPosts(limit: number = 5): Promise<Post[]> {
	try {
		const result = await payloadClient.getCollection<Post>("posts", {
			limit,
			sort: "-publishedAt",
			tags: ["posts:latest"],
		})

		return result.docs
	} catch (error) {
		console.error("Error fetching latest posts:", error)
		return []
	}
}
