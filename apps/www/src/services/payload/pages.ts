import type { SupportedLocale } from "@repo/i18n"
import { DEFAULT_LOCALE } from "@repo/i18n"

import { payloadClient } from "@/utils/payloadClient"
import { resolvePayloadBaseUrl } from "@/utils/payloadClient"
import type { Page } from "@repo/typescript-config/typings/payload-types"

function getPageVisibilityWhere(): Record<string, { equals: string }> {
	return { _status: { equals: "published" } }
}

async function getPreviewPageBySlug(slug: string, locale: SupportedLocale): Promise<Page | null> {
	const secret = process.env.WWW_INTERNAL_SECRET?.trim()
	if (!secret) return null
	const url = new URL(`${resolvePayloadBaseUrl()}/preview/pages`)
	url.searchParams.set("slug", slug)
	url.searchParams.set("locale", locale)
	const response = await fetch(url, {
		cache: "no-store",
		headers: { "www-internal-secret": secret },
	})
	if (!response.ok) return null
	return response.json() as Promise<Page>
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
		if (options?.includeDraft) return await getPreviewPageBySlug(slug, locale)
		return await payloadClient.getBySlug<Page>("pages", slug, {
			locale,
			depth: 2,
			cache: options?.cache,
			revalidate: options?.revalidate,
			tags: [`page:${slug}:${locale}`, `page-media:${locale}`],
			where: getPageVisibilityWhere(),
		})
	} catch (error) {
		console.error(`Error fetching page ${slug}:`, error)
		return null
	}
}

export async function getAllPages(options?: { locale?: SupportedLocale }): Promise<Page[]> {
	const locale = options?.locale ?? DEFAULT_LOCALE
	try {
		const pages: Page[] = []
		let page = 1
		let totalDocs = 0
		do {
			const result = await payloadClient.getCollection<Page>("pages", {
				locale,
				limit: 100,
				page,
				where: getPageVisibilityWhere(),
				tags: [`pages:all:${locale}`],
			})
			pages.push(...result.docs)
			totalDocs = result.totalDocs
			page += 1
		} while (pages.length < totalDocs)
		return pages
	} catch (error) {
		console.error("Error fetching all pages:", error)
		return []
	}
}
