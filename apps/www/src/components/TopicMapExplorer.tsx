"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import {
	getUiStrings,
	isSafePostSlug,
	resolveLocalizedPath,
	type SupportedLocale,
} from "@repo/i18n"
import { Treemap } from "@repo/ui/components/Treemap"

import type { TopicMapResponse } from "@/services/payload/topicMap"
import { topicMapToTree, topicMapTones } from "@/services/payload/topicMapAdapter"

export function TopicMapExplorer({
	data,
	locale,
}: {
	data: TopicMapResponse
	locale: SupportedLocale
}) {
	const router = useRouter()
	const strings = getUiStrings(locale).topicMap
	return (
		<Treemap
			data={topicMapToTree(data)}
			ariaLabel={strings.allCategories}
			onLeafActivate={(id) => {
				const article = data.categories
					.flatMap((category) => category.articles)
					.find((article) => `article:${article.id}` === id)
				if (article && isSafePostSlug(article.slug))
					router.push(resolveLocalizedPath(locale, `/posts/${encodeURIComponent(article.slug)}`))
			}}
			nodeTones={topicMapTones(data)}
		/>
	)
}
