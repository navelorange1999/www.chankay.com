import { getPostSection, type SectionablePost } from "./postSections"

export function postUnprefixedPath(post: SectionablePost, slug: string): string | null {
	const section = getPostSection(post)
	if (!section) return null

	return `/${section}/${slug.replace(/^\/+|\/+$/g, "")}`
}
