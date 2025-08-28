import type { ReactNode } from "react"

import { Inter } from "next/font/google"

import { ThemeProvider, PageTransition } from "@repo/ui"
import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"

import "./global.css"

const inter = Inter({ subsets: ["latin"] })

export default async function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
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
