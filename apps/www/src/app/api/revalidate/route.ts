import { revalidatePath, revalidateTag } from "next/cache"
import { NextResponse } from "next/server"

import { resolvePagePath } from "@/utils/seo"

const WWW_INTERNAL_SECRET_HEADER = "www-internal-secret"

type RevalidateRequestBody = {
	slugs?: string[]
}

function asStringArray(value: unknown): string[] {
	if (!Array.isArray(value)) {
		return []
	}

	return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
}

export async function POST(request: Request) {
	const configuredSecret = process.env.WWW_INTERNAL_SECRET?.trim()
	const providedSecret = request.headers.get(WWW_INTERNAL_SECRET_HEADER)?.trim()

	if (!configuredSecret || providedSecret !== configuredSecret) {
		return NextResponse.json({ error: "Invalid revalidation secret" }, { status: 401 })
	}

	const body = (await request.json().catch(() => null)) as RevalidateRequestBody | null
	const slugs = asStringArray(body?.slugs)

	for (const slug of slugs) {
		revalidatePath(resolvePagePath(slug))
		revalidateTag(`page:${slug}`)
	}

	revalidatePath("/sitemap.xml")
	revalidateTag("collection:pages")

	return NextResponse.json({
		ok: true,
		revalidated: slugs,
	})
}
