import { cache } from "react"

import { DEFAULT_LOCALE, type SupportedLocale } from "@repo/i18n"
import type { SiteConfig } from "@repo/typescript-config/typings/payload-types"

import { payloadClient } from "@/utils/payloadClient"

export const getSiteConfig = cache(
	async (locale: SupportedLocale = DEFAULT_LOCALE, revalidate?: number): Promise<SiteConfig> => {
		return payloadClient.getGlobal<SiteConfig>("site-config", {
			locale,
			revalidate,
			tags: [`global:site-config:${locale}`],
		})
	}
)

export async function getSiteConfigLatest(
	locale: SupportedLocale = DEFAULT_LOCALE
): Promise<SiteConfig> {
	return payloadClient.getGlobal<SiteConfig>("site-config", {
		locale,
		cache: "no-store",
	})
}
