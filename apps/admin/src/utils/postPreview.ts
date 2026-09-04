import { DEFAULT_LOCALE, isSupportedLocale, resolveLocalizedPath } from "@repo/i18n"

type BuildPostPreviewUrlArgs = {
	locale: unknown
	siteUrl: string
	slug: string
}

export function buildPostPreviewUrl({ locale, siteUrl, slug }: BuildPostPreviewUrlArgs): string {
	const resolvedLocale = isSupportedLocale(locale) ? locale : DEFAULT_LOCALE
	const encodedSlug = encodeURIComponent(slug.trim())
	const path = resolveLocalizedPath(resolvedLocale, `/posts/${encodedSlug}`)

	return new URL(path, new URL(siteUrl)).toString()
}
