import { cache } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Nodes } from "@/components/Nodes"
import { getAllPages, getPageBySlug } from "@/services/payload/pages"

type PageParams = {
	slug?: string[]
}

const DEFAULT_DESCRIPTION = "Personal website and blog of Chan Kay - Full-stack developer"

function normalizePageSlug(slug: string): string[] {
	if (slug === "/") {
		return []
	}

	return slug
		.replace(/^\/+|\/+$/g, "")
		.split("/")
		.filter(Boolean)
}

function resolveSlug(params: PageParams): string {
	return params.slug?.length ? params.slug.join("/") : "/"
}

const getPageBySlugCached = cache(async (slug: string) => {
	return getPageBySlug(slug)
})

export async function generateStaticParams(): Promise<PageParams[]> {
	const pages = await getAllPages()
	const paramsMap = new Map<string, PageParams>()

	for (const page of pages) {
		if (!page.slug) {
			continue
		}

		const segments = normalizePageSlug(page.slug)

		const key = segments.join("/")
		paramsMap.set(key, segments.length > 0 ? { slug: segments } : { slug: [] })
	}

	return Array.from(paramsMap.values())
}

export async function generateMetadata({
	params,
}: {
	params: Promise<PageParams>
}): Promise<Metadata> {
	const resolvedParams = await params

	const slug = resolveSlug(resolvedParams)
	const pageData = await getPageBySlugCached(slug)

	if (!pageData) {
		return {
			title: "Page Not Found | Chan Kay",
			description: DEFAULT_DESCRIPTION,
		}
	}

	return {
		title: pageData.seo?.metaTitle || pageData.title,
		description: pageData.seo?.metaDescription || DEFAULT_DESCRIPTION,
	}
}

export default async function Page({ params }: { params: Promise<PageParams> }) {
	const resolvedParams = await params
	const slug = resolveSlug(resolvedParams)

	const pageData = await getPageBySlugCached(slug)

	if (!pageData) {
		notFound()
	}

	return <Nodes nodes={pageData.structure} />
}
