import { DEFAULT_LOCALE, resolveLocalizedPath, type SupportedLocale } from "@repo/i18n"
import type { MediaInterface, SiteConfig } from "@repo/typescript-config/typings/payload-types"

const DEFAULT_SITE_NAME = "Chan Kay"
const DEFAULT_DESCRIPTION = "Personal website and blog of Chan Kay - Full-stack developer"
const DEFAULT_WWW_SITE_URL = "https://chankay.com"

function asRecord(value: unknown): Record<string, unknown> {
	if (!value || typeof value !== "object") return {}
	return value as Record<string, unknown>
}

function asOptionalString(value: unknown): string | undefined {
	return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined
}

export function resolveSiteName(siteConfig?: SiteConfig | null): string {
	return (
		asOptionalString(siteConfig?.metaTitle) ||
		asOptionalString(siteConfig?.siteName) ||
		DEFAULT_SITE_NAME
	)
}

export function resolveSiteDescription(
	siteConfig?: Pick<SiteConfig, "metaDescription" | "siteDescription"> | null
): string {
	return (
		asOptionalString(siteConfig?.metaDescription) ||
		asOptionalString(siteConfig?.siteDescription) ||
		DEFAULT_DESCRIPTION
	)
}

export function resolveSiteUrl(siteConfig?: SiteConfig | null): string {
	const configured =
		asOptionalString(siteConfig?.siteUrl) ||
		asOptionalString(process.env.WWW_SITE_URL) ||
		DEFAULT_WWW_SITE_URL

	return configured.replace(/\/+$/g, "")
}

export function resolvePagePath(
	slug?: string | null,
	locale: SupportedLocale = DEFAULT_LOCALE
): string {
	const value = asOptionalString(slug)
	const unprefixed = !value || value === "/" ? "/" : `/${value.replace(/^\/+|\/+$/g, "")}`
	return resolveLocalizedPath(locale, unprefixed)
}

export function resolvePageAbsoluteUrl(
	siteConfig: SiteConfig | null | undefined,
	slug?: string | null,
	locale: SupportedLocale = DEFAULT_LOCALE
): string {
	return new URL(resolvePagePath(slug, locale), `${resolveSiteUrl(siteConfig)}/`).toString()
}

export function resolveMedia(value: unknown): MediaInterface | null {
	if (!value || typeof value !== "object") {
		return null
	}

	const media = value as MediaInterface
	return typeof media === "object" ? media : null
}

export function resolveMediaUrl(args: {
	media: MediaInterface | null | undefined
	siteConfig?: SiteConfig | null
}): string | undefined {
	const mediaUrl = asOptionalString(args.media?.url) || asOptionalString(args.media?.thumbnailURL)
	if (!mediaUrl) {
		return undefined
	}

	return new URL(mediaUrl, `${resolveSiteUrl(args.siteConfig)}/`).toString()
}

export function resolveTwitterHandle(siteConfig?: SiteConfig | null): string | undefined {
	const socialSharing = asRecord(siteConfig?.socialSharing)
	const handle = asOptionalString(socialSharing.twitterHandle)
	if (!handle) {
		return undefined
	}

	return handle.startsWith("@") ? handle : `@${handle}`
}

export function resolveAllowIndexing(siteConfig?: SiteConfig | null): boolean {
	const robotsSettings = asRecord(siteConfig?.robotsSettings)
	return robotsSettings.allowIndexing !== false
}

export function resolveCustomRobotsTxt(siteConfig?: SiteConfig | null): string | undefined {
	const robotsSettings = asRecord(siteConfig?.robotsSettings)
	return asOptionalString(robotsSettings.customRobotsTxt)
}
