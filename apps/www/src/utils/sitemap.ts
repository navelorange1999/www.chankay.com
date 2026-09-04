import { getPostSection, resolvePostSectionPath, type SectionablePost } from "./postSections"

export function postUnprefixedPath(post: SectionablePost, slug: string): string | null {
	const section = getPostSection(post)
	return section ? resolvePostSectionPath(section, slug) : null
}
