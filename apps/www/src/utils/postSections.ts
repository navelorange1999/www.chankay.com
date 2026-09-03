import {
	DEFAULT_LOCALE,
	resolveRouteIndexPath,
	resolveRoutePath,
	type RouteDomainKey,
	type SupportedLocale,
} from "@repo/i18n"

export const POST_SECTIONS = {
	technical: { domain: "technical", tagSlug: "technical" },
	trading: { domain: "trading", tagSlug: "trading" },
} as const satisfies Record<string, { domain: RouteDomainKey; tagSlug: string }>

export type PostSection = keyof typeof POST_SECTIONS

export type SectionablePost = {
	primaryTag?: null | string | { id: string | number; slug?: null | string }
}

export function getPostSection(post: SectionablePost): PostSection | null {
	const { primaryTag } = post
	if (primaryTag == null) {
		return "technical"
	}

	if (typeof primaryTag === "string") {
		return null
	}

	const tagSlug = primaryTag.slug?.trim().toLowerCase()
	return (
		(Object.keys(POST_SECTIONS) as PostSection[]).find(
			(section) => POST_SECTIONS[section].tagSlug === tagSlug
		) ?? null
	)
}

export function isPostInSection(post: SectionablePost, section: PostSection): boolean {
	return getPostSection(post) === section
}

export function resolvePostSectionPath(
	section: PostSection,
	slug?: null | string,
	locale: SupportedLocale = DEFAULT_LOCALE
): string {
	const domain = POST_SECTIONS[section].domain
	return slug ? resolveRoutePath(domain, slug, locale) : resolveRouteIndexPath(domain, locale)
}

export function resolveLegacyPostPath(
	post: SectionablePost,
	slug: string,
	locale: SupportedLocale = DEFAULT_LOCALE
): string | null {
	const section = getPostSection(post)
	return section ? resolvePostSectionPath(section, slug, locale) : null
}
