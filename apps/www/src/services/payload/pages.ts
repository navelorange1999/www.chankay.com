import { payloadClient } from "@/utils/payloadClient"
import type { Page } from "@repo/typescript-config/typings/payload-types"

function getPageVisibilityWhere(): Record<string, { equals: string }> | undefined {
	if (process.env.NODE_ENV === "development") {
		return undefined
	}

	return {
		status: { equals: "published" },
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
			where: getPageVisibilityWhere(),
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
			where: getPageVisibilityWhere(),
		})

		return result.docs
	} catch (error) {
		console.error("Error fetching all pages:", error)
		return []
	}
}
