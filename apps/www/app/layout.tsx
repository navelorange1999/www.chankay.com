import type {ReactNode} from "react";

import {Inter} from "next/font/google";

import {ThemeProvider, Navbar, PageTransition} from "@repo/ui";

import "./global.css";

const inter = Inter({subsets: ["latin"]});

export default function RootLayout({children}: {children: ReactNode}) {
	return (
		<html lang="en" suppressHydrationWarning>
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
				</ThemeProvider>
			</body>
		</html>
	);
}
