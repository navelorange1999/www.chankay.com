import { headers } from "next/headers"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { Nodes } from "@/components/Nodes"
import { getPageBySlug } from "@/services/payload/pages"

type PageParams = {
	slug?: string[]
}

const WWW_INTERNAL_SECRET_HEADER = "www-internal-secret"

function resolveSlug(params: PageParams): string {
	return params.slug?.length ? params.slug.join("/") : "/"
}

function isPreviewAuthorized(secret: string | null): boolean {
	if (process.env.NODE_ENV === "development") {
		return true
	}

	const configuredSecret = process.env.WWW_INTERNAL_SECRET?.trim()
	return Boolean(configuredSecret && secret?.trim() === configuredSecret)
}

export const dynamic = "force-dynamic"
export const revalidate = 0

export const metadata: Metadata = {
	robots: {
		follow: false,
		index: false,
	},
}

// Next App Router treats leading-underscore segments like `_preview` as private
// folders, so they are excluded from routing. Use `%5Fpreview` on disk to expose
// the public `/_preview/*` route instead.
// Docs:
// https://nextjs.org/docs/app/getting-started/project-structure#private-folders
// https://nextjs.org/docs/app/building-your-application/routing/colocation#private-folders
export default async function PreviewPage({ params }: { params: Promise<PageParams> }) {
	const resolvedParams = await params
	const requestHeaders = await headers()
	const secret = requestHeaders.get(WWW_INTERNAL_SECRET_HEADER)

	if (!isPreviewAuthorized(secret)) {
		notFound()
	}

	const slug = resolveSlug(resolvedParams)
	const pageData = await getPageBySlug(slug, {
		cache: "no-store",
		includeDraft: true,
	})

	if (!pageData) {
		notFound()
	}

	return <Nodes nodes={pageData.structure} />
}
