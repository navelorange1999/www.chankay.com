import type { SupportedLocale } from "@repo/i18n"
import { DEFAULT_LOCALE } from "@repo/i18n"

import type { Category } from "@repo/typescript-config/typings/payload-types"

import { payloadClient } from "@/utils/payloadClient"

export async function getCategoryBySlug(
	slug: string,
	options?: { locale?: SupportedLocale }
): Promise<Category | null> {
	const locale = options?.locale ?? DEFAULT_LOCALE
	try {
		return await payloadClient.getBySlug<Category>("categories", slug, {
			locale,
			depth: 0,
			where: { _status: { equals: "published" } },
			tags: [`category:${slug}:${locale}`],
		})
	} catch (error) {
		console.error(`Error fetching category ${slug}:`, error)
		return null
	}
}
