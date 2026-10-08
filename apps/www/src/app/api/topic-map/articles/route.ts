import { NextResponse } from "next/server"

import { DEFAULT_LOCALE, isSupportedLocale } from "@repo/i18n"

import { resolvePayloadBaseUrl } from "@/utils/payloadClient"
import { isTopicArticlePage } from "@/services/payload/topicArticles"

const ID_PATTERN = /^(?:[a-zA-Z0-9_-]{1,80}|synthetic:(?:uncategorized|untagged))$/

export async function GET(request: Request) {
	const params = new URL(request.url).searchParams
	const allowed = new Set(["locale", "category", "topic", "page"])
	if (
		Array.from(params.keys()).some((key) => !allowed.has(key)) ||
		Array.from(allowed).some((key) => params.getAll(key).length > 1)
	) {
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
		const url = new URL(`${resolvePayloadBaseUrl()}/posts/topic-map/articles`)
		url.searchParams.set("locale", locale)
		url.searchParams.set("category", category)
		url.searchParams.set("topic", topic)
		url.searchParams.set("page", String(page))
		const response = await fetch(url, { cache: "no-store" })
		if (!response.ok) {
			return NextResponse.json(
				{
					error:
						response.status === 404 ? "TOPIC_SELECTION_UNAVAILABLE" : "TOPIC_ARTICLES_UNAVAILABLE",
				},
				{ status: response.status === 404 ? 404 : 503, headers: { "Cache-Control": "no-store" } }
			)
		}
		const body: unknown = await response.json()
		if (!isTopicArticlePage(body, { locale, category, topic, page }))
			throw new Error("Invalid topic articles response")
		return NextResponse.json(body, { headers: { "Cache-Control": "no-store" } })
	} catch {
		return NextResponse.json(
			{ error: "TOPIC_ARTICLES_UNAVAILABLE" },
			{ status: 503, headers: { "Cache-Control": "no-store" } }
		)
	}
}
