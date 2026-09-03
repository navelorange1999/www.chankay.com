import type { Metadata } from "next"

import {
	buildPostSectionArticleMetadata,
	buildPostSectionStaticParams,
	PostSectionArticle,
	type PostSectionArticleParams,
} from "@/components/posts/PostSectionArticle"

export async function generateStaticParams(): Promise<PostSectionArticleParams[]> {
	return buildPostSectionStaticParams("trading")
}

export async function generateMetadata({
	params,
}: {
	params: Promise<PostSectionArticleParams>
}): Promise<Metadata> {
	const { locale, slug } = await params
	return buildPostSectionArticleMetadata("trading", locale, slug)
}

export default async function TradingPostPage({
	params,
}: {
	params: Promise<PostSectionArticleParams>
}) {
	const { locale, slug } = await params
	return <PostSectionArticle locale={locale} section="trading" slug={slug} />
}
