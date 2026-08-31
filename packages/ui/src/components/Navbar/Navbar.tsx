import * as React from "react"
import Link from "next/link"

import type { SupportedLocale } from "@repo/i18n"
import { SiteConfig } from "@repo/typescript-config/typings/payload-types"

import { Container } from "../Container"
import { LanguageSwitcher } from "../LanguageSwitcher"
import { ThemeToggle } from "../ThemeProvider"
import { cn } from "#utils/classnames"
import { resolveLogoNode } from "#utils/resolveLogoNode"
import { ImageMedia } from "../Media"
import { NavbarDesktopNav } from "./NavbarDesktopNav"
import { NavbarMobileMenu } from "./NavbarMobileMenu"

export interface NavbarProps {
	siteConfig: SiteConfig
	className?: string
	fallbackLogo?: React.ReactNode
	homeHref?: string
	homeLabel?: string
	currentLocale?: SupportedLocale
}

export const Navbar: React.FC<NavbarProps> = ({
	siteConfig,
	className = "",
	fallbackLogo,
	homeHref = "/",
	homeLabel = "Home",
	currentLocale,
}) => {
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

	return (
		<nav
			className={cn(
				"relative sticky top-0 z-50",
				"bg-background shadow-sm border-b border-border",
				"backdrop-blur supports-[backdrop-filter]:bg-background/80",
				className
			)}
		>
			<Container>
				<div className="flex justify-between items-center h-[var(--navbar-height,4rem)]">
					<div className="flex-shrink-0">
						<Link
							aria-label={title || homeLabel}
							href={homeHref}
							className="flex items-center gap-1"
						>
							{logoNode}
							{showSiteName && (
								<span className="text-xl font-semibold text-foreground">{title}</span>
							)}
						</Link>
					</div>

					<NavbarDesktopNav items={items} />

					<div className="hidden md:flex md:items-center md:gap-1">
						{currentLocale ? <LanguageSwitcher currentLocale={currentLocale} /> : null}
						<ThemeToggle />
					</div>

					<NavbarMobileMenu items={items} />
				</div>
			</Container>
		</nav>
	)
}
