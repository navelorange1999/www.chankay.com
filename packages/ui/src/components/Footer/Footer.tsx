import * as React from "react"
import Link from "next/link"

import type { SiteConfig } from "@repo/typescript-config/typings/payload-types"

import { Container } from "../Container"
import { cn } from "#utils/classnames"
import { resolveLogoNode } from "#utils/resolveLogoNode"
import { ImageMedia } from "../Media"
import { SimpleIcon } from "../Icon"

const socialIcons = {
	github: <SimpleIcon name="github" className="w-4 h-4" />,
	bilibili: <SimpleIcon name="bilibili" className="w-4 h-4" />,
}

export interface FooterProps {
	siteConfig: SiteConfig
	accessibilityLabels?: {
		followOn: string
		logo: string
	}
	className?: string
	fallbackLogo?: React.ReactNode
}

export function Footer({
	siteConfig,
	accessibilityLabels = {
		followOn: "Follow us on {platform}",
		logo: "Website logo",
	},
	className = "",
	fallbackLogo,
}: FooterProps) {
	const currentYear = new Date().getFullYear()
	const title = siteConfig.siteName
	const logo = siteConfig.logo
	const copyright = siteConfig.footer?.copyrightText
	const socials =
		siteConfig.socialProfiles?.filter((profile) => profile.showInFooter !== false) || []
	const customFooterText = siteConfig.footer?.customFooterText
	const additionalLinks = siteConfig.footer?.additionalLinks || []
	const showLogo = siteConfig.footer?.showLogo !== false
	const showSiteName = siteConfig.footer?.showSiteName !== false
	const showSocialLinks = siteConfig.footer?.showSocialLinks !== false

	const logoNode = resolveLogoNode({
		showLogo,
		logo,
		fallbackLogo,
		renderImageLogo: (imageLogo) => (
			<ImageMedia
				resource={imageLogo}
				alt={accessibilityLabels.logo}
				className="h-8 w-8"
				imgClassName={cn("h-8 w-8 object-contain")}
				placeholder="empty"
				priority
			/>
		),
	})

	const defaultCopyright = `© ${currentYear} ${title}`

	return (
		<footer className={cn(`bg-card text-card-foreground py-6 border-t border-border`, className)}>
			{/* Container for the footer content */}
			<Container>
				{/* Main Footer Content */}
				<div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
					{/* Left: Logo and Name */}
					<div className="flex items-center gap-1">
						{logoNode}
						{showSiteName && <span className="text-lg font-semibold">{title}</span>}
					</div>

					{/* Right: Social Links */}
					{showSocialLinks && socials.length > 0 && (
						<div className="flex gap-4">
							{socials.map((social) => (
								<Link
									key={social.platform}
									href={social.url}
									className="text-muted-foreground hover:text-foreground transition-colors duration-200"
									aria-label={accessibilityLabels.followOn.replace("{platform}", social.platform)}
									target="_blank"
									rel="noopener noreferrer"
								>
									{socialIcons[social.platform as keyof typeof socialIcons] || social.platform}
								</Link>
							))}
						</div>
					)}
				</div>

				{/* Bottom: Navigation and Copyright */}
				<div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-4 border-t border-border">
					{/* Additional Links */}
					{additionalLinks.length > 0 && (
						<nav className="flex gap-6 text-sm">
							{additionalLinks.map((link) => (
								<Link
									key={link.label}
									href={link.url}
									className="text-muted-foreground hover:text-foreground transition-colors duration-200"
									{...(link.external && {
										target: "_blank",
										rel: "noopener noreferrer",
									})}
								>
									{link.label}
								</Link>
							))}
						</nav>
					)}

					<div className="flex flex-col items-center md:items-end gap-2">
						{/* Copyright */}
						<p className="text-muted-foreground text-sm">{copyright || defaultCopyright}</p>
						{/* Custom Footer Text */}
						{customFooterText && (
							<p className="text-muted-foreground/80 text-xs">{customFooterText}</p>
						)}
					</div>
				</div>
			</Container>
		</footer>
	)
}
