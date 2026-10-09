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
			<section className="w-full min-w-0 py-12" aria-label={block.title}>
				<p role="status" className="text-sm text-muted-foreground">
					{data ? strings.emptyMap : strings.unavailableMap}
				</p>
			</section>
		)
	}
	return (
		<section className="w-full min-w-0 py-12" aria-label={block.title}>
			<TopicMapExplorer data={data} locale={locale} />
		</section>
	)
}
