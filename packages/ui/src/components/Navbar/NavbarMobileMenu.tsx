"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"

import type { SiteConfig } from "@repo/typescript-config/typings/payload-types"

import { cn } from "#utils/classnames"
import { ThemeToggle } from "../ThemeProvider"
import { resolveActiveNavUrl } from "./utils"

type MenuItem = NonNullable<NonNullable<NonNullable<SiteConfig["navigation"]>["menuItems"]>>[number]

export interface NavbarMobileMenuProps {
	items: MenuItem[]
}

export function NavbarMobileMenu({ items }: NavbarMobileMenuProps) {
	const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
	const pathname = usePathname()
	const activeUrl = resolveActiveNavUrl(pathname, items)

	const toggleMobileMenu = () => {
		setMobileMenuOpen((isOpen) => !isOpen)
	}

	return (
		<div className="flex items-center space-x-2 md:hidden">
			<ThemeToggle />

			{items.length > 0 ? (
				<button
					type="button"
					onClick={toggleMobileMenu}
					className="rounded-lg p-2 text-foreground transition-colors duration-200 hover:bg-secondary"
					aria-expanded={mobileMenuOpen}
					aria-label="Toggle mobile menu"
				>
					{mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
				</button>
			) : null}

			<div
				className={cn(
					"absolute inset-x-0 top-full overflow-hidden border-b border-border bg-background shadow-sm transition-[max-height,opacity] duration-200 ease-in-out md:hidden",
					mobileMenuOpen ? "max-h-96 opacity-100" : "pointer-events-none max-h-0 opacity-0"
				)}
			>
				<div className="mx-auto max-w-screen-2xl px-4">
					<div className="space-y-1 border-t border-border px-2 pb-3 pt-2">
						{items
							.filter((item: MenuItem) => item.showInMobile !== false)
							.map((item: MenuItem) => {
								const isActive = activeUrl === item.url

								return (
									<Link
										key={item.label}
										href={item.url}
										onClick={() => setMobileMenuOpen(false)}
										className={cn(
											"block rounded-lg px-3 py-2 text-base font-medium transition-colors duration-200 hover:bg-secondary hover:text-primary",
											isActive ? "bg-secondary text-primary" : "text-muted-foreground"
										)}
									>
										{item.label}
									</Link>
								)
							})}
					</div>
				</div>
			</div>
		</div>
	)
}
