import { revalidatePath, revalidateTag } from "next/cache"
import { NextResponse } from "next/server"

import { SUPPORTED_LOCALES, type SupportedLocale, isSupportedLocale } from "@repo/i18n"

import { resolvePagePath } from "@/utils/seo"
import { POST_SECTIONS, resolvePostSectionPath, type PostSection } from "@/utils/postSections"

const WWW_INTERNAL_SECRET_HEADER = "www-internal-secret"

type RevalidateRequestBody = {
	collection?: string
	slugs?: string[]
	locales?: string[]
}

function asStringArray(value: unknown): string[] {
	if (!Array.isArray(value)) {
		return []
	}

	return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
}

function resolveLocales(input: string[]): SupportedLocale[] {
	const filtered = input.filter(isSupportedLocale)
	return filtered.length > 0 ? filtered : [...SUPPORTED_LOCALES]
}

type RevalidationHandler = (slugs: string[], locales: SupportedLocale[]) => void

const revalidationHandlers: Record<string, RevalidationHandler> = {
	pages(slugs, locales) {
		for (const locale of locales) {
			for (const slug of slugs) {
				revalidatePath(resolvePagePath(slug, locale))
				revalidateTag(`page:${slug}:${locale}`)
			}
			revalidateTag(`pages:all:${locale}`)
		}
		revalidatePath("/sitemap.xml")
	},

	posts(slugs, locales) {
		for (const locale of locales) {
			for (const slug of slugs) {
				const detailPaths = (Object.keys(POST_SECTIONS) as PostSection[])
					.map((section) => resolvePostSectionPath(section, slug, locale))
					.filter((path): path is string => path !== null)

				for (const detailPath of detailPaths) {
					revalidatePath(detailPath)
				}
				if (detailPaths.length > 0) {
					revalidateTag(`post:${slug}:${locale}`)
				}
			}
			for (const section of Object.keys(POST_SECTIONS) as PostSection[]) {
				revalidatePath(resolvePostSectionPath(section, undefined, locale))
				revalidateTag(`posts:section:${section}:${locale}`)
			}
			revalidateTag(`posts:${locale}`)
			revalidateTag(`posts:latest:${locale}`)
			revalidateTag(`posts:all:${locale}`)
		}
		revalidatePath("/sitemap.xml")
	},

	tags(_slugs, locales) {
		for (const locale of locales) {
			for (const section of Object.keys(POST_SECTIONS) as PostSection[]) {
				revalidatePath(resolvePostSectionPath(section, undefined, locale))
				revalidateTag(`posts:section:${section}:${locale}`)
				revalidateTag(`tag:${POST_SECTIONS[section].tagSlug}:${locale}`)
			}
		}
		revalidatePath("/sitemap.xml")
	},

	"site-config"(_slugs, locales) {
		for (const locale of locales) {
			revalidateTag(`global:site-config:${locale}`)
		}
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
	const locales = resolveLocales(asStringArray(body?.locales))

	const handler = revalidationHandlers[collection] ?? revalidationHandlers.pages!
	handler(slugs, locales)

	return NextResponse.json({
		ok: true,
		collection,
		revalidated: slugs,
		locales,
	})
}
