import {
	DEFAULT_LOCALE,
	isDefaultLocale,
	isSupportedLocale,
	type SupportedLocale,
} from "./config.js"
import { getRouteDomain, type RouteDomainKey } from "./route-domains.js"

export type LocalizedPath = {
	locale: SupportedLocale
	path: string
}

function normalizePath(path: string): string {
	const trimmed = path.trim()
	if (!trimmed || trimmed === "/") {
		return "/"
	}
	return `/${trimmed.replace(/^\/+|\/+$/g, "")}`
}

function joinPath(...parts: string[]): string {
	const cleaned = parts.map((part) => part.trim().replace(/^\/+|\/+$/g, "")).filter(Boolean)
	return cleaned.length > 0 ? `/${cleaned.join("/")}` : "/"
}

export function stripLocalePrefix(path: string): LocalizedPath {
	const normalizedPath = normalizePath(path)
	const [, firstSegment = "", ...rest] = normalizedPath.split("/")

	if (!isSupportedLocale(firstSegment)) {
		return {
			locale: DEFAULT_LOCALE,
			path: normalizedPath,
		}
	}

	return {
		locale: firstSegment,
		path: rest.length > 0 ? `/${rest.join("/")}` : "/",
	}
}

export function resolveLocalizedPath(locale: SupportedLocale, path: string): string {
	const unprefixedPath = stripLocalePrefix(path).path
	if (isDefaultLocale(locale)) {
		return unprefixedPath
	}
	return joinPath(locale, unprefixedPath)
}

export function resolveRouteIndexPath(domain: RouteDomainKey, locale: SupportedLocale): string {
	const routeDomain = getRouteDomain(domain)
	if (!routeDomain.index) {
		throw new Error(`Route domain "${domain}" does not define an index route.`)
	}
	return resolveLocalizedPath(locale, joinPath(routeDomain.basePath))
}

export function resolveRoutePath(
	domain: RouteDomainKey,
	slug: string,
	locale: SupportedLocale
): string {
	const routeDomain = getRouteDomain(domain)
	const normalizedSlug = normalizePath(slug)

	if (routeDomain.kind === "catchAll") {
		return resolveLocalizedPath(locale, normalizedSlug)
	}

	return resolveLocalizedPath(locale, joinPath(routeDomain.basePath, normalizedSlug))
}
