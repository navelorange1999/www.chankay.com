"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"

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
		<div className="md:hidden flex items-center space-x-2">
			<ThemeToggle />

			{items.length > 0 ? (
				<button
					onClick={toggleMobileMenu}
					className="p-2 rounded-lg text-foreground hover:bg-secondary transition-colors duration-200"
					aria-expanded={mobileMenuOpen}
					aria-label="Toggle mobile menu"
				>
					{mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
				</button>
			) : null}

			<AnimatePresence>
				{mobileMenuOpen ? (
					<motion.div
						className="absolute inset-x-0 top-full md:hidden border-b border-border bg-background shadow-sm"
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: "auto" }}
						exit={{ opacity: 0, height: 0 }}
						transition={{ duration: 0.2, ease: "easeInOut" }}
					>
						<div className="mx-auto max-w-screen-2xl px-4">
							<div className="px-2 pt-2 pb-3 space-y-1 border-t border-border">
								{items
									.filter((item: MenuItem) => item.showInMobile !== false)
									.map((item: MenuItem, index: number) => {
										const isActive = activeUrl === item.url

										return (
											<motion.div
												key={item.label}
												initial={{ opacity: 0, x: -20 }}
												animate={{ opacity: 1, x: 0 }}
												transition={{
													duration: 0.2,
													delay: index * 0.05,
													ease: "easeOut",
												}}
											>
												<Link
													href={item.url}
													onClick={() => setMobileMenuOpen(false)}
													className={cn(
														"block rounded-lg px-3 py-2 text-base font-medium transition-colors duration-200 hover:bg-secondary hover:text-primary",
														isActive ? "bg-secondary text-primary" : "text-muted-foreground"
													)}
												>
													{item.label}
												</Link>
											</motion.div>
										)
									})}
							</div>
						</div>
					</motion.div>
				) : null}
			</AnimatePresence>
		</div>
	)
}
