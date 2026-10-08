import configPromise from "@payload-config"
import { getPayload } from "payload"
import { NextResponse } from "next/server"

import { DEFAULT_LOCALE, isSupportedLocale } from "@repo/i18n"

import { getPublicTopicArticles, TopicSelectionUnavailable } from "@/services/topicMap/articles"

const ID_PATTERN = /^(?:[a-zA-Z0-9_-]{1,80}|synthetic:(?:uncategorized|untagged))$/

export async function GET(request: Request) {
	const params = new URL(request.url).searchParams
	const allowed = new Set(["locale", "category", "topic", "page"])
	if (Array.from(params.keys()).some((key) => !allowed.has(key))) {
		return NextResponse.json({ error: "INVALID_QUERY" }, { status: 400 })
	}
	if (Array.from(allowed).some((key) => params.getAll(key).length > 1)) {
		return NextResponse.json({ error: "INVALID_QUERY" }, { status: 400 })
	}
	const locale = params.get("locale") ?? DEFAULT_LOCALE
	const category = params.get("category") ?? ""
	const topic = params.get("topic") ?? ""
	const rawPage = params.get("page") ?? "1"
	const page = Number(rawPage)
	if (
		!isSupportedLocale(locale) ||
		!ID_PATTERN.test(category) ||
		!ID_PATTERN.test(topic) ||
		category === "synthetic:untagged" ||
		topic === "synthetic:uncategorized" ||
		!/^\d+$/.test(rawPage) ||
		!Number.isSafeInteger(page) ||
		page < 1
	) {
		return NextResponse.json({ error: "INVALID_QUERY" }, { status: 400 })
	}

	try {
		const payload = await getPayload({ config: configPromise })
		const result = await getPublicTopicArticles(payload, locale, { category, topic, page })
		return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } })
	} catch (error) {
		if (error instanceof TopicSelectionUnavailable) {
			return NextResponse.json({ error: "TOPIC_SELECTION_UNAVAILABLE" }, { status: 404 })
		}
		return NextResponse.json({ error: "TOPIC_ARTICLES_UNAVAILABLE" }, { status: 503 })
	}
}
