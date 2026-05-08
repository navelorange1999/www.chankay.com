import type { ReactNode } from "react"
import type { Metadata } from "next"

import { headers } from "next/headers"
import { Inter } from "next/font/google"
import NextTopLoader from "nextjs-toploader"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"

import { DEFAULT_LOCALE, isSupportedLocale, type SupportedLocale } from "@repo/i18n"

import { Container } from "@repo/ui/components/Container"
import { ThemeProvider, ThemeScript } from "@repo/ui/components/ThemeProvider"
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

const LOCALE_HEADER = "x-locale"

async function resolveCurrentLocale(): Promise<SupportedLocale> {
	const requestHeaders = await headers()
	const headerValue = requestHeaders.get(LOCALE_HEADER)
	return isSupportedLocale(headerValue) ? headerValue : DEFAULT_LOCALE
}

export async function generateMetadata(): Promise<Metadata> {
	const locale = await resolveCurrentLocale()
	const siteConfig = await getSiteConfig(locale)
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
	const locale = await resolveCurrentLocale()
	const siteConfig = await getSiteConfig(locale)

	return (
		<html lang={locale} suppressHydrationWarning>
			<head>
				<ThemeScript />
			</head>

			<body className={inter.className}>
				<NextTopLoader color="currentColor" showForHashAnchor={false} showSpinner={false} />
				<ThemeProvider
					attribute="class"
					defaultTheme="system"
					enableSystem
					disableTransitionOnChange
				>
					<Navbar siteConfig={siteConfig} currentLocale={locale} />
					<main className="min-h-[calc(100dvh-var(--navbar-height,4rem))] bg-background">
						<Container className="py-5 md:py-8">{children}</Container>
					</main>
					<Footer siteConfig={siteConfig} currentLocale={locale} />
					<Analytics />
					<SpeedInsights />
				</ThemeProvider>
			</body>
		</html>
	)
}
