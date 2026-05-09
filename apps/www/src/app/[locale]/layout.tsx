import type { ReactNode } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Inter } from "next/font/google"
import NextTopLoader from "nextjs-toploader"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"

import { isSupportedLocale, SUPPORTED_LOCALES, type SupportedLocale } from "@repo/i18n"

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

import "../global.css"

const inter = Inter({ subsets: ["latin"] })

type LocaleLayoutParams = { locale: string }

export function generateStaticParams(): LocaleLayoutParams[] {
	return SUPPORTED_LOCALES.map((locale) => ({ locale }))
}

export async function generateMetadata({
	params,
}: {
	params: Promise<LocaleLayoutParams>
}): Promise<Metadata> {
	const { locale } = await params
	if (!isSupportedLocale(locale)) {
		return {}
	}

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
		icons: {
			icon: [
				{ url: "/favicon/favicon.ico", sizes: "any" },
				{ url: "/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
				{ url: "/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
				{ url: "/favicon/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
				{ url: "/favicon/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
			],
			shortcut: "/favicon/favicon.ico",
			apple: { url: "/favicon/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
		},
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

export default async function LocaleLayout({
	children,
	params,
}: {
	children: ReactNode
	params: Promise<LocaleLayoutParams>
}) {
	const { locale } = await params
	if (!isSupportedLocale(locale)) {
		notFound()
	}

	void (locale satisfies SupportedLocale)

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
				</ThemeProvider>
				<Analytics />
				<SpeedInsights />
			</body>
		</html>
	)
}
