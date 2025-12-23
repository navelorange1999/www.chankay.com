import type { ReactNode } from "react"

import { Inter } from "next/font/google"

import { PageTransition, ThemeProvider, ThemeScript } from "@repo/ui"
import { Footer } from "@/components/Footer"
import { Navbar } from "@/components/Navbar"

import "./global.css"

const inter = Inter({ subsets: ["latin"] })

export default async function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<ThemeScript />
				<link href="/favicon/favicon.ico" rel="icon" sizes="32x32" />
			</head>
			<body className={inter.className}>
				<ThemeProvider
					attribute="class"
					defaultTheme="system"
					enableSystem
					disableTransitionOnChange
				>
					<Navbar />
					<main className="min-h-screen bg-gray-50 dark:bg-gray-900">
						<PageTransition>{children}</PageTransition>
					</main>
					<Footer />
				</ThemeProvider>
			</body>
		</html>
	)
}
