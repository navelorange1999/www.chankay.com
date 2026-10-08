import configPromise from "@payload-config"
import { getPayload } from "payload"
import { NextResponse } from "next/server"

import { DEFAULT_LOCALE, isSupportedLocale } from "@repo/i18n"

const SECRET_HEADER = "www-internal-secret"
const SLUG_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9/_-]{0,199}$/

export async function GET(request: Request) {
	const configuredSecret = process.env.WWW_INTERNAL_SECRET?.trim()
	const providedSecret = request.headers.get(SECRET_HEADER)?.trim()
	if (!configuredSecret || providedSecret !== configuredSecret) {
		return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
	}
	const params = new URL(request.url).searchParams
	if (
		Array.from(params.keys()).some((key) => key !== "slug" && key !== "locale") ||
		params.getAll("slug").length !== 1 ||
		params.getAll("locale").length > 1
	) {
		return NextResponse.json({ error: "INVALID_QUERY" }, { status: 400 })
	}
	const slug = params.get("slug") ?? ""
	const locale = params.get("locale") ?? DEFAULT_LOCALE
	if ((slug !== "/" && !SLUG_PATTERN.test(slug)) || !isSupportedLocale(locale)) {
		return NextResponse.json({ error: "INVALID_QUERY" }, { status: 400 })
	}
	try {
		const payload = await getPayload({ config: configPromise })
		const result = await payload.find({
			collection: "pages",
			draft: true,
			depth: 2,
			locale,
			limit: 1,
			overrideAccess: true,
			where: { slug: { equals: slug } },
		})
		const page = result.docs[0]
		if (!page) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 })
		return NextResponse.json(page, {
			headers: { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex" },
		})
	} catch {
		return NextResponse.json({ error: "PREVIEW_UNAVAILABLE" }, { status: 503 })
	}
}
