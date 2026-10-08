import configPromise from "@payload-config"
import { getPayload } from "payload"
import { NextResponse } from "next/server"

import { DEFAULT_LOCALE, getUiStrings, isSupportedLocale } from "@repo/i18n"

import { getPublicTopicMap } from "@/services/topicMap/query"

export async function GET(request: Request) {
	const params = new URL(request.url).searchParams
	if (
		Array.from(params.keys()).some((key) => key !== "locale") ||
		params.getAll("locale").length > 1
	) {
		return NextResponse.json({ error: "INVALID_QUERY" }, { status: 400 })
	}
	const requestedLocale = params.get("locale") ?? DEFAULT_LOCALE
	if (!isSupportedLocale(requestedLocale)) {
		return NextResponse.json({ error: "INVALID_LOCALE" }, { status: 400 })
	}

	try {
		const payload = await getPayload({ config: configPromise })
		const labels = getUiStrings(requestedLocale).topicMap
		const result = await getPublicTopicMap(payload, requestedLocale, {
			uncategorized: labels.uncategorized,
		})
		return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } })
	} catch {
		return NextResponse.json({ error: "TOPIC_MAP_UNAVAILABLE" }, { status: 503 })
	}
}
