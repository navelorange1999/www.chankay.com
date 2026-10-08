import * as React from "react"

import type { SupportedLocale } from "@repo/i18n"
import { getUiStrings } from "@repo/i18n"
import type { Page } from "@repo/typescript-config/typings/payload-types"

import { TopicMapExplorer } from "@/components/TopicMapExplorer"
import { getTopicMap } from "@/services/payload/topicMap"

type TopicMapBlock = Extract<NonNullable<Page["structure"]>[number], { blockType: "topicMap" }>

export async function TopicMapNode({
	block,
	locale,
	isPreview = false,
}: {
	block: TopicMapBlock
	locale: SupportedLocale
	isPreview?: boolean
}) {
	if (!block.enabled) return null
	const data = await getTopicMap(locale)
	if (!data || data.totals.areaValue === 0) {
		if (!isPreview) return null
		const strings = getUiStrings(locale).topicMap
		return (
			<section className="mx-auto w-full max-w-7xl px-4 py-12" aria-label={block.title}>
				<h2 className="mb-2 text-2xl font-semibold text-foreground">{block.title}</h2>
				<p role="status" className="text-sm text-muted-foreground">
					{data ? strings.emptyMap : strings.unavailableMap}
				</p>
			</section>
		)
	}
	return (
		<section className="mx-auto w-full max-w-7xl px-4 py-12" aria-label={block.title}>
			<h2 className="mb-2 text-2xl font-semibold text-foreground">{block.title}</h2>
			{block.description && <p className="mb-5 text-muted-foreground">{block.description}</p>}
			<TopicMapExplorer
				data={data}
				locale={locale}
				maxTopicsPerCategory={block.maxTopicsPerCategory ?? 8}
			/>
		</section>
	)
}
