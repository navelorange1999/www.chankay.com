import { isSafePostSlug } from "@repo/i18n"

import { getPostSection, type SectionablePost } from "./postSections"

export function postUnprefixedPath(post: SectionablePost, slug: string): string | null {
	const section = getPostSection(post)
	if (!section || !isSafePostSlug(slug)) return null

	return `/${section}/${slug.replace(/^\/+|\/+$/g, "")}`
}
