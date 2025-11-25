import { payloadClient } from "@/utils/payloadClient"
import type { Post } from "@repo/typescript-config/typings/payload-types"

/**
 * Get all posts
 */
export async function getPosts(options?: {
	limit?: number
	page?: number
}): Promise<{ docs: Post[]; totalDocs: number }> {
	try {
		const result = await payloadClient.getCollection<Post>("posts", {
			limit: options?.limit ?? 10,
			page: options?.page ?? 1,
			revalidate: 60,
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
			revalidate: 60,
			tags: [`post:${slug}`],
		})
	} catch (error) {
		console.error(`Error fetching post ${slug}:`, error)
		return null
	}
}

/**
 * Get latest posts
 */
export async function getLatestPosts(limit: number = 5): Promise<Post[]> {
	try {
		const result = await payloadClient.getCollection<Post>("posts", {
			limit,
			revalidate: 300, // 5 minutes
			tags: ["posts:latest"],
		})

		return result.docs
	} catch (error) {
		console.error("Error fetching latest posts:", error)
		return []
	}
}
