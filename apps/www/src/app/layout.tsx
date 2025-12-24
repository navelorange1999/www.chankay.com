import type { ReactNode } from "react"
import { cache } from "react"

import { Inter } from "next/font/google"
import NextTopLoader from "nextjs-toploader"

import { Container, PageTransition, ThemeProvider, ThemeScript } from "@repo/ui"
import { SiteConfig } from "@repo/typescript-config/typings/payload-types"

import { Footer } from "@/components/Footer"
import { Navbar } from "@/components/Navbar"
import { payloadClient } from "@/utils/payloadClient"

import "./global.css"

const inter = Inter({ subsets: ["latin"] })

// Cache the site config fetch to prevent re-fetching on route transitions
const getSiteConfig = cache(async (): Promise<SiteConfig> => {
	return payloadClient.getGlobal<SiteConfig>("site-config")
})

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
					<main className="min-h-screen bg-background">
						<Container className="py-8">
							<PageTransition>{children}</PageTransition>
						</Container>
					</main>
					<Footer />
				</ThemeProvider>
			</body>
		</html>
	)
}
