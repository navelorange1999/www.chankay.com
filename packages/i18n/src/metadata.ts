import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type SupportedLocale } from "./config.js"
import { resolveRouteIndexPath, resolveRoutePath } from "./paths.js"
import type { RouteDomainKey } from "./route-domains.js"

export type LocaleAlternates = {
	canonical: string
	languages: Record<SupportedLocale | "x-default", string>
}

function resolveAbsoluteUrl(siteUrl: string, path: string): string {
	return new URL(path, `${siteUrl.replace(/\/+$/g, "")}/`).toString()
}

function buildLanguages(args: {
	pathForLocale: (locale: SupportedLocale) => string
	siteUrl: string
}): Record<SupportedLocale | "x-default", string> {
	const languages = {} as Record<SupportedLocale | "x-default", string>
	for (const locale of SUPPORTED_LOCALES) {
		languages[locale] = resolveAbsoluteUrl(args.siteUrl, args.pathForLocale(locale))
	}
	languages["x-default"] = resolveAbsoluteUrl(args.siteUrl, args.pathForLocale(DEFAULT_LOCALE))
	return languages
}

export function buildRouteAlternates(args: {
	currentLocale: SupportedLocale
	domain: RouteDomainKey
	siteUrl: string
	slug: string
}): LocaleAlternates {
	const pathForLocale = (locale: SupportedLocale) =>
		resolveRoutePath(args.domain, args.slug, locale)
	return {
		canonical: resolveAbsoluteUrl(args.siteUrl, pathForLocale(args.currentLocale)),
		languages: buildLanguages({
			pathForLocale,
			siteUrl: args.siteUrl,
		}),
	}
}

export function buildRouteIndexAlternates(args: {
	currentLocale: SupportedLocale
	domain: RouteDomainKey
	siteUrl: string
}): LocaleAlternates {
	const pathForLocale = (locale: SupportedLocale) => resolveRouteIndexPath(args.domain, locale)
	return {
		canonical: resolveAbsoluteUrl(args.siteUrl, pathForLocale(args.currentLocale)),
		languages: buildLanguages({
			pathForLocale,
			siteUrl: args.siteUrl,
		}),
	}
}
