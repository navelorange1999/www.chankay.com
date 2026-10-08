import * as React from "react"

import { notFound, permanentRedirect } from "next/navigation"

import type { SupportedLocale } from "@repo/i18n"

import { getPostBySlug } from "@/services/payload/posts"
import { getPostSection, resolveLegacyPostPath } from "@/utils/postSections"

import {
	buildPostSectionArticleMetadata,
	PostSectionArticle,
} from "@/components/posts/PostSectionArticle"

type LegacyPostPageParams = {
	locale: SupportedLocale
	slug: string
}

export async function generateMetadata({ params }: { params: Promise<LegacyPostPageParams> }) {
	const { locale, slug } = await params
	const post = await getPostBySlug(slug, { locale })
	return buildPostSectionArticleMetadata(post ? getPostSection(post) : null, locale, slug)
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

	if (getPostSection(post)) permanentRedirect(target)
	return <PostSectionArticle locale={locale} section={null} slug={slug} />
}
