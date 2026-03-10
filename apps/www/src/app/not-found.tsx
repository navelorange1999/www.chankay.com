import type { Metadata } from "next"

import { BackgroundBeams } from "@repo/ui"

export const metadata: Metadata = {
	title: {
		absolute: "404 - Page Not Found | ChanKay Blog",
	},
	description: "The page you are looking for does not exist.",
}

export default function NotFound() {
	return (
		<div className="relative min-h-[calc(100dvh-var(--navbar-height,4rem))] w-full overflow-hidden bg-background flex items-center justify-center">
			<BackgroundBeams />
			<div className="relative z-10 text-center px-4">
				<h1 className="text-4xl md:text-6xl font-bold  mb-4">404 - Page Not Found</h1>
				<p className="text-lg md:text-x max-w-2xl">The page you are looking for does not exist.</p>
			</div>
		</div>
	)
}
