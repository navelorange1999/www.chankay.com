import type { SupportedLocale } from "@repo/i18n"
import { DEFAULT_LOCALE } from "@repo/i18n"

import type { Tag } from "@repo/typescript-config/typings/payload-types"

import { payloadClient } from "@/utils/payloadClient"

export async function getTagBySlug(
	slug: string,
	options?: { locale?: SupportedLocale }
): Promise<Tag | null> {
	const locale = options?.locale ?? DEFAULT_LOCALE
	try {
		return await payloadClient.getBySlug<Tag>("tags", slug, {
			locale,
			depth: 0,
			tags: [`tag:${slug}:${locale}`],
		})
	} catch (error) {
		console.error(`Error fetching tag ${slug}:`, error)
		return null
	}
}
