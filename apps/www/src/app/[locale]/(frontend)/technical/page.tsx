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
	return buildPostSectionIndexMetadata("technical", locale)
}

export default async function TechnicalPage({
	params,
}: {
	params: Promise<PostSectionPageParams>
}) {
	const { locale } = await params
	return <PostSectionArchive locale={locale} section="technical" />
}
