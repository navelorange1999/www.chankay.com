import {Navbar, Footer} from "@repo/ui";
import type {ReactNode} from "react";
import "./global.css";

export default function RootLayout({children}: {children: ReactNode}) {
	return (
		<html lang="en">
			<body className="bg-background text-foreground">
				<Navbar
					title="chankay"
					links={[
						{label: "Home", href: "/"},
						{label: "Blog", href: "/blog"},
						{label: "About", href: "/about"},
					]}
				/>
				<main className="min-h-[60vh] container mx-auto px-4 py-8">
					{children}
				</main>
				<Footer
					title="chankay"
					description="A modern website powered by Payload and Next.js."
					sections={[
						{
							title: "Links",
							links: [
								{
									label: "GitHub",
									href: "https://github.com/chankay",
									external: true,
								},
								{
									label: "Twitter",
									href: "https://twitter.com/chankay",
									external: true,
								},
							],
						},
					]}
				/>
			</body>
		</html>
	);
}
