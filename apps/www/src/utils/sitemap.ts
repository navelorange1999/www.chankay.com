import { resolveLegacyPostPath, type SectionablePost } from "./postSections"

export function postUnprefixedPath(post: SectionablePost, slug: string): string | null {
	return resolveLegacyPostPath(post, slug)
}
