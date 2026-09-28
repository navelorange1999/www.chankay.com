import type { SupportedLocale } from "@repo/i18n"
import type { SiteConfig } from "@repo/typescript-config/typings/payload-types"

import { resolvePageAbsoluteUrl, resolveSiteDescription, resolveSiteName } from "./seo"

function publicUrl(value: string | null | undefined): string | undefined {
	if (!value?.trim()) return undefined
	try {
		const url = new URL(value)
		if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) {
			return undefined
		}
		return url.toString()
	} catch {
		return undefined
	}
}

export function buildWebsiteStructuredData(siteConfig: SiteConfig, locale: SupportedLocale) {
	const url = resolvePageAbsoluteUrl(siteConfig, "/", locale)
	const authorName = siteConfig.author?.name?.trim()
	const authorUrl = publicUrl(siteConfig.author?.url)

	return {
		"@context": "https://schema.org",
		"@type": "WebSite",
		"@id": `${url}#website`,
		name: resolveSiteName(siteConfig),
		url,
		description: resolveSiteDescription(siteConfig),
		inLanguage: locale,
		...(authorName
			? {
					author: {
						"@type": "Person",
						name: authorName,
						...(authorUrl ? { url: authorUrl } : {}),
					},
				}
			: {}),
	}
}

export function serializeStructuredData(value: Record<string, unknown>): string {
	return JSON.stringify(value).replace(/</g, "\\u003c")
}
