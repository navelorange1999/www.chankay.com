import Link from "next/link"

import { SiteConfig } from "@repo/typescript-config/typings/payload-types"

import { cn } from "#utils/classnames"
import { ImageMedia } from "#components/Media"

export interface FooterProps {
	siteConfig: SiteConfig
	className?: string
}

export function Footer({ siteConfig, className = "" }: FooterProps) {
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

	const defaultCopyright = `© ${currentYear} ${title}`

	return (
		<footer className={cn(`bg-gray-900 text-white py-6`, className)}>
			{/* Container for the footer content */}
			<div className="container mx-auto px-4 md:px-6">
				{/* Main Footer Content */}
				<div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
					{/* Left: Logo and Name */}
					<div className="flex items-center gap-3">
						{showLogo && logo && (
							<ImageMedia
								resource={logo}
								alt={`${title} logo`}
								className="h-8 w-8 rounded-full object-cover"
							/>
						)}
						{showSiteName && <span className="text-lg font-semibold">{title}</span>}
					</div>

					{/* Right: Social Links */}
					{showSocialLinks && socials.length > 0 && (
						<div className="flex gap-4">
							{socials.map((social) => (
								<Link
									key={social.platform}
									href={social.url}
									className="text-gray-400 hover:text-white transition-colors duration-200"
									aria-label={`Follow us on ${social.platform}`}
									target="_blank"
									rel="noopener noreferrer"
								>
									{social.platform}
								</Link>
							))}
						</div>
					)}
				</div>

				{/* Bottom: Navigation and Copyright */}
				<div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-4 border-t border-gray-800">
					{/* Additional Links */}
					{additionalLinks.length > 0 && (
						<nav className="flex gap-6 text-sm">
							{additionalLinks.map((link) => (
								<Link
									key={link.label}
									href={link.url}
									className="text-gray-400 hover:text-white transition-colors duration-200"
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
						<p className="text-gray-400 text-sm">{copyright || defaultCopyright}</p>
						{/* Custom Footer Text */}
						{customFooterText && <p className="text-gray-500 text-xs">{customFooterText}</p>}
					</div>
				</div>
			</div>
		</footer>
	)
}
