import type { SupportedLocale } from "@repo/i18n"
import { DEFAULT_LOCALE } from "@repo/i18n"

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

export async function getPageBySlug(
	slug: string,
	options?: {
		locale?: SupportedLocale
		cache?: RequestCache
		includeDraft?: boolean
		revalidate?: number
	}
): Promise<Page | null> {
	const locale = options?.locale ?? DEFAULT_LOCALE
	try {
		return await payloadClient.getBySlug<Page>("pages", slug, {
			locale,
			depth: 2,
			cache: options?.cache,
			revalidate: options?.revalidate,
			tags: [`page:${slug}:${locale}`],
			where: getPageVisibilityWhere(options?.includeDraft),
		})
	} catch (error) {
		console.error(`Error fetching page ${slug}:`, error)
		return null
	}
}

export async function getAllPages(options?: { locale?: SupportedLocale }): Promise<Page[]> {
	const locale = options?.locale ?? DEFAULT_LOCALE
	try {
		const result = await payloadClient.getCollection<Page>("pages", {
			locale,
			limit: 100,
			where: getPageVisibilityWhere(),
			tags: [`pages:all:${locale}`],
		})

		return result.docs
	} catch (error) {
		console.error("Error fetching all pages:", error)
		return []
	}
}
