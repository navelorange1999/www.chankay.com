"use client"

import * as React from "react"
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"

import { SiteConfig } from "@repo/typescript-config/typings/payload-types"

import { Container } from "../Container"
import { ThemeToggle } from "../ThemeProvider"
import { cn } from "#utils/classnames"
import { resolveLogoNode } from "#utils/resolveLogoNode"
import { ImageMedia } from "../Media"
import { useSlidingIndicator } from "#hooks/useSlidingIndicator"

type MenuItem = NonNullable<NonNullable<NonNullable<SiteConfig["navigation"]>["menuItems"]>>[number]

export interface NavbarProps {
	siteConfig: SiteConfig
	className?: string
	fallbackLogo?: React.ReactNode
}

export const Navbar: React.FC<NavbarProps> = ({ siteConfig, className = "", fallbackLogo }) => {
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
	const pathname = usePathname()
	const { containerRef, setItemRef, indicator } = useSlidingIndicator(pathname)

	// Extract configuration from siteConfig
	const logo = siteConfig.logo
	const title = siteConfig.siteName
	const items = siteConfig.navigation?.menuItems || []
	const showLogo = siteConfig.navigation?.showLogo !== false
	const showSiteName = siteConfig.navigation?.showSiteName !== false

	const logoNode = resolveLogoNode({
		showLogo,
		logo,
		fallbackLogo,
		renderImageLogo: (imageLogo) => (
			<ImageMedia resource={imageLogo} placeholder="empty" priority />
		),
	})

	const toggleMobileMenu = () => {
		setMobileMenuOpen(!mobileMenuOpen)
	}

	return (
		<nav
			className={cn(
				"sticky top-0 z-50",
				"bg-background shadow-sm border-b border-border",
				"backdrop-blur supports-[backdrop-filter]:bg-background/80",
				className
			)}
		>
			<Container>
				<div className="flex justify-between items-center h-[var(--navbar-height,4rem)]">
					{/* Logo */}
					<div className="flex-shrink-0">
						<Link aria-label={title || "Home"} href="/" className="flex items-center gap-1">
							{logoNode}
							{showSiteName && (
								<span className="text-xl font-semibold text-foreground">{title}</span>
							)}
						</Link>
					</div>

					{/* Desktop Navigation */}
					<div
						ref={containerRef}
						className="relative hidden md:flex md:flex-1 md:items-center md:justify-start md:pl-10 md:gap-2"
					>
						{items.map((item: MenuItem) => {
							const isActive = pathname === item.url
							return (
								<Link
									key={item.label}
									ref={(el) => setItemRef(item.url, el)}
									href={item.url}
									className={cn(
										"relative px-3 py-2 text-sm font-medium transition-colors duration-200 hover:text-primary",
										isActive ? "text-primary" : "text-muted-foreground"
									)}
								>
									{item.label}
								</Link>
							)
						})}

						{/* Sliding active indicator */}
						{indicator && (
							<motion.span
								className="absolute bottom-0 h-0.5 bg-primary rounded-full pointer-events-none"
								animate={{
									left: indicator.left,
									width: indicator.width,
								}}
								transition={{
									type: "spring",
									stiffness: 350,
									damping: 30,
								}}
							/>
						)}
					</div>

					{/* Theme Toggle - Desktop */}
					<div className="hidden md:flex md:items-center">
						<ThemeToggle />
					</div>

					{/* Mobile menu button */}
					<div className="md:hidden flex items-center space-x-2">
						{/* Mobile Theme Toggle */}
						<ThemeToggle />

						{/* Hamburger Menu */}
						<button
							onClick={toggleMobileMenu}
							className="p-2 rounded-lg text-foreground hover:bg-secondary transition-colors duration-200"
							aria-label="Toggle mobile menu"
						>
							{mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
						</button>
					</div>
				</div>

				{/* Mobile Navigation Menu */}
				<AnimatePresence>
					{mobileMenuOpen && (
						<motion.div
							className="md:hidden"
							initial={{ opacity: 0, height: 0 }}
							animate={{ opacity: 1, height: "auto" }}
							exit={{ opacity: 0, height: 0 }}
							transition={{ duration: 0.3, ease: "easeInOut" }}
						>
							<div className="px-2 pt-2 pb-3 space-y-1 border-t border-border">
								{items
									.filter((item: MenuItem) => item.showInMobile !== false)
									.map((item: MenuItem, index: number) => {
										const isActive = pathname === item.url
										return (
											<motion.div
												key={item.label}
												initial={{ opacity: 0, x: -30 }}
												animate={{ opacity: 1, x: 0 }}
												transition={{
													duration: 0.3,
													delay: index * 0.1,
													ease: "easeOut",
												}}
											>
												<Link
													href={item.url}
													onClick={() => setMobileMenuOpen(false)}
													className={`block px-3 py-2 text-base font-medium rounded-lg transition-colors duration-200 hover:text-primary hover:bg-secondary ${
														isActive ? "text-primary bg-secondary" : "text-muted-foreground"
													}`}
												>
													{item.label}
												</Link>
											</motion.div>
										)
									})}
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</Container>
		</nav>
	)
}
