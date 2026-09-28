import { SUPPORTED_LOCALES } from "@repo/i18n"

import { getSiteConfig } from "@/services/payload/site-config"
import { resolveCustomRobotsTxt, resolveSiteUrl } from "@/utils/seo"

export const revalidate = 60

export async function GET() {
	const siteConfig = await getSiteConfig()
	const customRules = resolveCustomRobotsTxt(siteConfig)
	const defaultRules = [
		"User-agent: *",
		"Allow: /",
		"Disallow: /_preview/",
		...SUPPORTED_LOCALES.map((locale) => `Disallow: /${locale}/_preview/`),
	].join("\n")
	// Keep the sitemap origin consistent even when editors supply custom crawler rules.
	const rules = (customRules || defaultRules)
		.split(/\r?\n/)
		.filter((line) => !/^\s*sitemap\s*:/i.test(line))
		.join("\n")
		.trim()
	const sitemapUrl = new URL("/sitemap.xml", `${resolveSiteUrl(siteConfig)}/`).toString()

	return new Response(`${rules}\n\nSitemap: ${sitemapUrl}\n`, {
		headers: { "Content-Type": "text/plain; charset=utf-8" },
	})
}
