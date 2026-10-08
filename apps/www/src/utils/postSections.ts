import {
	DEFAULT_LOCALE,
	isSafePostSlug,
	resolveRouteIndexPath,
	resolveRoutePath,
	resolveLocalizedPath,
	type RouteDomainKey,
	type SupportedLocale,
} from "@repo/i18n"

export const POST_SECTIONS = {
	technical: { domain: "technical", categorySlug: "technical" },
	trading: { domain: "trading", categorySlug: "trading" },
} as const satisfies Record<string, { domain: RouteDomainKey; categorySlug: string }>

export type PostSection = keyof typeof POST_SECTIONS

export type SectionablePost = {
	category?:
		| null
		| string
		| { id: string | number; slug?: null | string; _status?: null | "draft" | "published" }
}

export function getPostSection(post: SectionablePost): PostSection | null {
	const { category } = post
	if (!category || typeof category === "string" || category._status !== "published") {
		return null
	}

	const categorySlug = category.slug?.trim().toLowerCase()
	return (
		(Object.keys(POST_SECTIONS) as PostSection[]).find(
			(section) => POST_SECTIONS[section].categorySlug === categorySlug
		) ?? null
	)
}

export function isPostInSection(post: SectionablePost, section: PostSection): boolean {
	return getPostSection(post) === section
}

export function resolvePostSectionPath(
	section: PostSection,
	slug?: null | undefined,
	locale?: SupportedLocale
): string

export function resolvePostSectionPath(
	section: PostSection,
	slug: string,
	locale?: SupportedLocale
): string | null
export function resolvePostSectionPath(
	section: PostSection,
	slug?: null | string,
	locale: SupportedLocale = DEFAULT_LOCALE
): string | null {
	const domain = POST_SECTIONS[section].domain
	if (slug == null) {
		return resolveRouteIndexPath(domain, locale)
	}

	return isSafePostSlug(slug) ? resolveRoutePath(domain, slug, locale) : null
}

export function resolveLegacyPostPath(
	post: SectionablePost,
	slug: string,
	locale: SupportedLocale = DEFAULT_LOCALE
): string | null {
	const section = getPostSection(post)
	if (!isSafePostSlug(slug)) return null
	return section
		? resolvePostSectionPath(section, slug, locale)
		: resolveLocalizedPath(locale, `/posts/${slug}`)
}
