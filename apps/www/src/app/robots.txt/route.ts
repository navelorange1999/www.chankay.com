import { NextResponse } from "next/server"

import { resolveSiteUrl } from "@/utils/seo"

export async function GET() {
	const siteUrl = resolveSiteUrl()
	const lines = [
		"User-agent: *",
		"Allow: /",
		"Disallow: /_preview/",
		`Sitemap: ${new URL("/sitemap.xml", `${siteUrl}/`).toString()}`,
	]

	return new NextResponse(lines.join("\n"), {
		headers: {
			"Content-Type": "text/plain; charset=utf-8",
		},
	})
}
