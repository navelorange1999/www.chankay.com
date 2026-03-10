import { payloadClient } from "@/utils/payloadClient"
import type { Page } from "@repo/typescript-config/typings/payload-types"

function getPageVisibilityWhere(
	includeDraft?: boolean
): Record<string, { equals: string }> | undefined {
	if (includeDraft) {
		return undefined
	}

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
export async function getPageBySlug(
	slug: string,
	options?: {
		cache?: RequestCache
		includeDraft?: boolean
		revalidate?: number
	}
): Promise<Page | null> {
	try {
		return await payloadClient.getBySlug<Page>("pages", slug, {
			depth: 2,
			cache: options?.cache,
			revalidate: options?.revalidate ?? 60,
			tags: [`page:${slug}`],
			where: getPageVisibilityWhere(options?.includeDraft),
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
