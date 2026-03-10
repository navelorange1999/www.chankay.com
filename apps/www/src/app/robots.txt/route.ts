import { NextResponse } from "next/server"

import { getSiteConfig } from "@/services/payload/site-config"
import { resolveAllowIndexing, resolveCustomRobotsTxt, resolveSiteUrl } from "@/utils/seo"

export async function GET() {
	const siteConfig = await getSiteConfig()
	const customRobotsTxt = resolveCustomRobotsTxt(siteConfig)

	if (customRobotsTxt) {
		return new NextResponse(customRobotsTxt, {
			headers: {
				"Content-Type": "text/plain; charset=utf-8",
			},
		})
	}

	const siteUrl = resolveSiteUrl(siteConfig)
	const allowIndexing = resolveAllowIndexing(siteConfig)
	const lines = [
		"User-agent: *",
		allowIndexing ? "Allow: /" : "Disallow: /",
		"Disallow: /_preview/",
		`Sitemap: ${new URL("/sitemap.xml", `${siteUrl}/`).toString()}`,
	]

	return new NextResponse(lines.join("\n"), {
		headers: {
			"Content-Type": "text/plain; charset=utf-8",
		},
	})
}
