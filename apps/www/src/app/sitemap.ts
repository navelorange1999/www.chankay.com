import type { MetadataRoute } from "next"

import {
	DEFAULT_LOCALE,
	SUPPORTED_LOCALES,
	resolveLocalizedPath,
	type SupportedLocale,
} from "@repo/i18n"

import { getAllPages } from "@/services/payload/pages"
import { getAllPosts } from "@/services/payload/posts"
import { resolveSiteUrl } from "@/utils/seo"
import { getSiteConfig } from "@/services/payload/site-config"
import { postUnprefixedPath } from "@/utils/sitemap"
import type { Post } from "@repo/typescript-config/typings/payload-types"

function buildAlternates(siteUrl: string, unprefixedPath: string): Record<string, string> {
	const languages: Record<string, string> = {}
	for (const locale of SUPPORTED_LOCALES) {
		languages[locale] = new URL(
			resolveLocalizedPath(locale, unprefixedPath),
			`${siteUrl}/`
		).toString()
	}
	languages["x-default"] = new URL(
		resolveLocalizedPath(DEFAULT_LOCALE, unprefixedPath),
		`${siteUrl}/`
	).toString()
	return languages
}

function pageUnprefixedPath(slug: string): string {
	if (!slug || slug === "/") return "/"
	return `/${slug.replace(/^\/+|\/+$/g, "")}`
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const siteConfig = await getSiteConfig()
	const siteUrl = resolveSiteUrl(siteConfig)
	const slugByLocaleForPages = new Map<SupportedLocale, Set<string>>()
	const postsByLocale = new Map<SupportedLocale, Post[]>()

	await Promise.all(
		SUPPORTED_LOCALES.map(async (locale) => {
			const [pages, posts] = await Promise.all([getAllPages({ locale }), getAllPosts({ locale })])
			slugByLocaleForPages.set(
				locale,
				new Set(pages.filter((p) => Boolean(p.slug)).map((p) => p.slug as string))
			)
			postsByLocale.set(locale, posts)
		})
	)

	const entries: MetadataRoute.Sitemap = []
	const seenPageKeys = new Set<string>()
	const seenPostKeys = new Set<string>()

	for (const locale of SUPPORTED_LOCALES) {
		const pageSlugs = slugByLocaleForPages.get(locale) ?? new Set<string>()
		for (const slug of pageSlugs) {
			const unprefixed = pageUnprefixedPath(slug)
			const key = `${locale}|${unprefixed}`
			if (seenPageKeys.has(key)) continue
			seenPageKeys.add(key)
			entries.push({
				url: new URL(resolveLocalizedPath(locale, unprefixed), `${siteUrl}/`).toString(),
				alternates: { languages: buildAlternates(siteUrl, unprefixed) },
			})
		}

		const posts = postsByLocale.get(locale) ?? []
		for (const post of posts) {
			if (!post.slug) continue

			const unprefixed = postUnprefixedPath(post, post.slug)
			if (!unprefixed) continue
			const key = `${locale}|${unprefixed}`
			if (seenPostKeys.has(key)) continue
			seenPostKeys.add(key)
			entries.push({
				url: new URL(resolveLocalizedPath(locale, unprefixed), `${siteUrl}/`).toString(),
				alternates: { languages: buildAlternates(siteUrl, unprefixed) },
			})
		}
	}

	return entries
}
