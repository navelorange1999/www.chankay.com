import { revalidatePath, revalidateTag } from "next/cache"
import { NextResponse } from "next/server"

import { resolvePagePath } from "@/utils/seo"

const WWW_INTERNAL_SECRET_HEADER = "www-internal-secret"

type RevalidateRequestBody = {
	collection?: string
	slugs?: string[]
}

function asStringArray(value: unknown): string[] {
	if (!Array.isArray(value)) {
		return []
	}

	return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
}

type RevalidationHandler = (slugs: string[]) => void

const revalidationHandlers: Record<string, RevalidationHandler> = {
	pages(slugs) {
		for (const slug of slugs) {
			revalidatePath(resolvePagePath(slug))
			revalidateTag(`page:${slug}`)
		}
		revalidatePath("/sitemap.xml")
		revalidateTag("collection:pages")
	},

	posts(slugs) {
		for (const slug of slugs) {
			revalidatePath(`/posts/${slug}`)
			revalidateTag(`post:${slug}`)
		}
		revalidatePath("/posts")
		revalidatePath("/sitemap.xml")
		revalidateTag("posts")
		revalidateTag("posts:latest")
		revalidateTag("posts:all")
	},

	"site-config"() {
		revalidateTag("global:site-config")
		revalidatePath("/", "layout")
		revalidatePath("/sitemap.xml")
		revalidatePath("/robots.txt")
	},
}

export async function POST(request: Request) {
	const configuredSecret = process.env.WWW_INTERNAL_SECRET?.trim()
	const providedSecret = request.headers.get(WWW_INTERNAL_SECRET_HEADER)?.trim()

	if (!configuredSecret || providedSecret !== configuredSecret) {
		return NextResponse.json({ error: "Invalid revalidation secret" }, { status: 401 })
	}

	const body = (await request.json().catch(() => null)) as RevalidateRequestBody | null
	const collection = typeof body?.collection === "string" ? body.collection : "pages"
	const slugs = asStringArray(body?.slugs)

	const handler = revalidationHandlers[collection] ?? revalidationHandlers.pages!
	handler(slugs)

	return NextResponse.json({
		ok: true,
		collection,
		revalidated: slugs,
	})
}
