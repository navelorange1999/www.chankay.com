import { payloadClient } from "@/utils/payloadClient"
import type { Page } from "@repo/typescript-config/typings/payload-types"

/**
 * Get homepage data
 */
export async function getHomePage(): Promise<Page | null> {
	try {
		const page = await payloadClient.getBySlug<Page>("pages", "/", {
			depth: 2,
			revalidate: 60,
			tags: ["page:/"],
		})

		return page
	} catch (error) {
		console.error("Error fetching homepage:", error)
		return null
	}
}

/**
 * Get page by slug
 */
export async function getPageBySlug(slug: string): Promise<Page | null> {
	try {
		return await payloadClient.getBySlug<Page>("pages", slug, {
			depth: 2,
			revalidate: 60,
			tags: [`page:${slug}`],
		})
	} catch (error) {
		console.error(`Error fetching page ${slug}:`, error)
		return null
	}
}

/**
 * Get all pages (for static routing)
 */
export async function getAllPages(): Promise<Page[]> {
	try {
		const result = await payloadClient.getCollection<Page>("pages", {
			limit: 100,
			revalidate: 3600, // 1 hour
		})

		return result.docs
	} catch (error) {
		console.error("Error fetching all pages:", error)
		return []
	}
}
