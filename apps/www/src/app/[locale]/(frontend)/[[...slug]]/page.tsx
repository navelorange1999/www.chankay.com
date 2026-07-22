import { cache } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import {
	buildRouteAlternates,
	getUiStrings,
	SUPPORTED_LOCALES,
	type SupportedLocale,
} from "@repo/i18n"

import { Nodes } from "@/components/Nodes"
import { getSiteConfig } from "@/services/payload/site-config"
import { getAllPages, getPageBySlug } from "@/services/payload/pages"
import {
	resolveMedia,
	resolveMediaUrl,
	resolveSiteDescription,
	resolveSiteUrl,
	resolveTwitterHandle,
} from "@/utils/seo"

type PageParams = {
	locale: SupportedLocale
	slug?: string[]
}

function asRecord(value: unknown): Record<string, unknown> {
	if (!value || typeof value !== "object") return {}
	return value as Record<string, unknown>
}

function asOptionalString(value: unknown): string | undefined {
	return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined
}

function normalizePageSlug(slug: string): string[] {
	if (slug === "/") {
		return []
	}

	return slug
		.replace(/^\/+|\/+$/g, "")
		.split("/")
		.filter(Boolean)
}

function resolveSlug(params: PageParams): string {
	return params.slug?.length ? params.slug.join("/") : "/"
}

const getPageBySlugCached = cache(async (slug: string, locale: SupportedLocale) => {
	return getPageBySlug(slug, { locale })
})

export async function generateStaticParams(): Promise<PageParams[]> {
	const allParams: PageParams[] = []
	for (const locale of SUPPORTED_LOCALES) {
		const pages = await getAllPages({ locale })
		const paramsMap = new Map<string, PageParams>()

		for (const page of pages) {
			if (!page.slug) continue
			const segments = normalizePageSlug(page.slug)
			const key = segments.join("/")
			paramsMap.set(key, segments.length > 0 ? { locale, slug: segments } : { locale, slug: [] })
		}

		allParams.push(...paramsMap.values())
	}
	return allParams
}

export async function generateMetadata({
	params,
}: {
	params: Promise<PageParams>
}): Promise<Metadata> {
	const resolvedParams = await params
	const slug = resolveSlug(resolvedParams)
	const [pageData, siteConfig] = await Promise.all([
		getPageBySlugCached(slug, resolvedParams.locale),
		getSiteConfig(resolvedParams.locale),
	])

	if (!pageData) {
		const strings = getUiStrings(resolvedParams.locale).notFound
		return {
			title: { absolute: strings.title },
			description: strings.description,
		}
	}

	const seo = asRecord(pageData.seo)
	const title = asOptionalString(seo.metaTitle) || pageData.title
	const description = asOptionalString(seo.metaDescription) || resolveSiteDescription(siteConfig)
	const alternates = buildRouteAlternates({
		currentLocale: resolvedParams.locale,
		domain: "pages",
		siteUrl: resolveSiteUrl(siteConfig),
		slug,
	})
	const ogImageUrl = resolveMediaUrl({
		media: resolveMedia(seo.ogImage) || resolveMedia(siteConfig.ogImage),
		siteConfig,
	})
	const twitterHandle = resolveTwitterHandle(siteConfig)

	return {
		title,
		description,
		alternates: {
			canonical: alternates.canonical,
			languages: alternates.languages,
		},
		openGraph: {
			description,
			images: ogImageUrl ? [{ url: ogImageUrl }] : undefined,
			title,
			type: "website",
			url: alternates.canonical,
		},
		twitter: {
			card: ogImageUrl ? "summary_large_image" : "summary",
			creator: twitterHandle,
			description,
			images: ogImageUrl ? [ogImageUrl] : undefined,
			site: twitterHandle,
			title,
		},
	}
}

export default async function Page({ params }: { params: Promise<PageParams> }) {
	const resolvedParams = await params
	const slug = resolveSlug(resolvedParams)

	const pageData = await getPageBySlugCached(slug, resolvedParams.locale)

	if (!pageData) {
		notFound()
	}

	return <Nodes nodes={pageData.structure} />
}
