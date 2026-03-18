import type { ReactNode } from "react"
import type { Metadata } from "next"

import { Inter } from "next/font/google"
import NextTopLoader from "nextjs-toploader"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"

import { Container, ThemeProvider, ThemeScript } from "@repo/ui"
import { Footer } from "@/components/Footer"
import { Navbar } from "@/components/Navbar"
import { getSiteConfig } from "@/services/payload/site-config"
import {
	resolveAllowIndexing,
	resolveMedia,
	resolveMediaUrl,
	resolveSiteDescription,
	resolveSiteName,
	resolveSiteUrl,
	resolveTwitterHandle,
} from "@/utils/seo"

import "./global.css"

const inter = Inter({ subsets: ["latin"] })

export async function generateMetadata(): Promise<Metadata> {
	const siteConfig = await getSiteConfig()
	const siteName = resolveSiteName(siteConfig)
	const description = resolveSiteDescription(siteConfig)
	const siteUrl = resolveSiteUrl(siteConfig)
	const twitterHandle = resolveTwitterHandle(siteConfig)
	const ogImageUrl = resolveMediaUrl({
		media: resolveMedia(siteConfig.ogImage),
		siteConfig,
	})
	const allowIndexing = resolveAllowIndexing(siteConfig)

	return {
		metadataBase: new URL(siteUrl),
		title: {
			default: siteName,
			template: `%s | ${siteName}`,
		},
		description,
		robots: {
			follow: allowIndexing,
			index: allowIndexing,
		},
		openGraph: {
			description,
			images: ogImageUrl ? [{ url: ogImageUrl }] : undefined,
			siteName,
			title: siteName,
			type: "website",
			url: siteUrl,
		},
		twitter: {
			card: ogImageUrl ? "summary_large_image" : "summary",
			creator: twitterHandle,
			description,
			images: ogImageUrl ? [ogImageUrl] : undefined,
			site: twitterHandle,
			title: siteName,
		},
	}
}

export default async function RootLayout({ children }: { children: ReactNode }) {
	const siteConfig = await getSiteConfig()

	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<ThemeScript />
				<link href="/favicon/favicon.ico" rel="icon" sizes="32x32" />
			</head>

			<body className={inter.className}>
				<NextTopLoader color="currentColor" showSpinner={false} />
				<ThemeProvider
					attribute="class"
					defaultTheme="system"
					enableSystem
					disableTransitionOnChange
				>
					<Navbar siteConfig={siteConfig} />
					<main className="min-h-[calc(100dvh-var(--navbar-height,4rem))] bg-background">
						<Container className="py-8">{children}</Container>
					</main>
					<Footer siteConfig={siteConfig} />
					<Analytics />
					<SpeedInsights />
				</ThemeProvider>
			</body>
		</html>
	)
}
