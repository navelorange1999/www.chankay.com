import type { Metadata } from "next"

import {
	buildPostSectionIndexMetadata,
	PostSectionArchive,
	type PostSectionPageParams,
} from "@/components/posts/PostSectionArchive"

export async function generateMetadata({
	params,
}: {
	params: Promise<PostSectionPageParams>
}): Promise<Metadata> {
	const { locale } = await params
	return buildPostSectionIndexMetadata("trading", locale)
}

export default async function TradingPage({ params }: { params: Promise<PostSectionPageParams> }) {
	const { locale } = await params
	return <PostSectionArchive locale={locale} section="trading" />
}
