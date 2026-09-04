import { notFound, permanentRedirect } from "next/navigation"

import type { SupportedLocale } from "@repo/i18n"

import { getPostBySlug } from "@/services/payload/posts"
import { resolveLegacyPostPath } from "@/utils/postSections"

type LegacyPostPageParams = {
	locale: SupportedLocale
	slug: string
}

export default async function LegacyPostPage({
	params,
}: {
	params: Promise<LegacyPostPageParams>
}) {
	const { locale, slug } = await params
	const post = await getPostBySlug(slug, { locale })

	if (!post) {
		notFound()
	}

	const target = resolveLegacyPostPath(post, slug, locale)
	if (!target) {
		notFound()
	}

	permanentRedirect(target)
}
