/**
 * Site Configuration Utilities
 * Helper functions to fetch and use site configuration
 */

import type { SiteConfig } from "@repo/typescript-config/typings/payload-types"

/**
 * Fetch site configuration from PayloadCMS
 * This can be used in server components or API routes
 */
export async function getSiteConfig(): Promise<SiteConfig | null> {
	try {
		// In a real implementation, you would use PayloadCMS REST API or local API
		// For now, this is a placeholder that shows the structure

		const payload = (await import("payload")).default

		const siteConfig = await payload.findGlobal({
			slug: "site-config",
		})

		return siteConfig as SiteConfig
	} catch (error) {
		console.error("Failed to fetch site configuration:", error)
		return null
	}
}

/**
 * Default site configuration fallbacks
 * Used when site config is not available or as defaults
 */
export const defaultSiteConfig: Partial<SiteConfig> = {
	siteName: "Chankay Blog",
	siteDescription: "A modern blog platform built with Next.js and PayloadCMS",
	siteUrl: "https://www.chankay.com",
	defaultLanguage: "en",
	timezone: "Asia/Shanghai",
	metaTitle: "Chankay Blog - Modern Web Development",
	metaDescription: "Insights, tutorials, and thoughts on modern web development",
	robotsSettings: {
		allowIndexing: true,
	},
	socialSharing: {
		enableSharing: true,
	},
	analytics: {
		googleAnalyticsId: undefined,
	},
	performance: {
		enableImageOptimization: true,
		enableLazyLoading: true,
		cacheMaxAge: 3600,
	},
	comments: {
		enableComments: false,
	},
	newsletter: {
		enableNewsletter: false,
	},
	navigation: {
		showLogo: true,
		showSiteName: true,
		showSearch: true,
		showThemeToggle: true,
		menuItems: [
			{ label: "Home", url: "/", external: false, showInMobile: true },
			{ label: "Blog", url: "/blog", external: false, showInMobile: true },
			{ label: "About", url: "/about", external: false, showInMobile: true },
		],
	},
	footer: {
		showLogo: true,
		showSiteName: true,
		showSocialLinks: true,
		showBackToTop: true,
		copyrightText: undefined, // Will be auto-generated
		customFooterText: "Built with Next.js and PayloadCMS",
		additionalLinks: [
			{ label: "Privacy Policy", url: "/privacy", external: false },
			{ label: "Terms of Service", url: "/terms", external: false },
		],
	},
	maintenance: {
		maintenanceMode: false,
	},
}

/**
 * Merge site config with defaults
 * Ensures all required fields have fallback values
 */
export function mergeSiteConfigWithDefaults(config: SiteConfig | null): Required<SiteConfig> {
	if (!config) {
		return defaultSiteConfig as Required<SiteConfig>
	}

	return {
		...defaultSiteConfig,
		...config,
		// Ensure nested objects are properly merged
		robotsSettings: {
			...defaultSiteConfig.robotsSettings,
			...config.robotsSettings,
		},
		socialSharing: {
			...defaultSiteConfig.socialSharing,
			...config.socialSharing,
		},
		analytics: {
			...defaultSiteConfig.analytics,
			...config.analytics,
		},
		performance: {
			...defaultSiteConfig.performance,
			...config.performance,
		},
		comments: {
			...defaultSiteConfig.comments,
			...config.comments,
		},
		newsletter: {
			...defaultSiteConfig.newsletter,
			...config.newsletter,
		},
		navigation: {
			...defaultSiteConfig.navigation,
			...config.navigation,
		},
		footer: {
			...defaultSiteConfig.footer,
			...config.footer,
		},
		maintenance: {
			...defaultSiteConfig.maintenance,
			...config.maintenance,
		},
	} as Required<SiteConfig>
}

/**
 * Get social profile URL by platform
 */
export function getSocialProfileUrl(config: SiteConfig, platform: string): string | null {
	const profile = config.socialProfiles?.find((p) => p.platform === platform)
	return profile?.url || null
}

/**
 * Check if maintenance mode is active
 */
export function isMaintenanceModeActive(config: SiteConfig): boolean {
	return config.maintenance?.maintenanceMode || false
}

/**
 * Get site title with fallback
 */
export function getSiteTitle(config: SiteConfig | null): string {
	return config?.siteName || defaultSiteConfig.siteName || "Chankay Blog"
}

/**
 * Get site description with fallback
 */
export function getSiteDescription(config: SiteConfig | null): string {
	return config?.siteDescription || defaultSiteConfig.siteDescription || "A modern blog platform"
}

/**
 * Get navigation menu items with fallback
 */
export function getNavigationItems(config: SiteConfig | null) {
	return config?.navigation?.menuItems || defaultSiteConfig.navigation?.menuItems || []
}

/**
 * Get footer additional links with fallback
 */
export function getFooterLinks(config: SiteConfig | null) {
	return config?.footer?.additionalLinks || defaultSiteConfig.footer?.additionalLinks || []
}

/**
 * Generate copyright text based on configuration
 */
export function generateCopyrightText(config: SiteConfig): string {
	if (config.footer?.copyrightText) {
		return config.footer.copyrightText
	}

	const currentYear = new Date().getFullYear()
	const siteName = config.siteName || defaultSiteConfig.siteName
	return `© ${currentYear} ${siteName}. All rights reserved.`
}

/**
 * Check if navigation should show logo
 */
export function shouldShowNavigationLogo(config: SiteConfig | null): boolean {
	return config?.navigation?.showLogo !== false // Default to true
}

/**
 * Check if navigation should show site name
 */
export function shouldShowNavigationSiteName(config: SiteConfig | null): boolean {
	return config?.navigation?.showSiteName !== false // Default to true
}

/**
 * Check if navigation should show search button
 */
export function shouldShowSearchButton(config: SiteConfig | null): boolean {
	return config?.navigation?.showSearch !== false // Default to true
}

/**
 * Check if navigation should show theme toggle
 */
export function shouldShowThemeToggle(config: SiteConfig | null): boolean {
	return config?.navigation?.showThemeToggle !== false // Default to true
}

/**
 * Check if footer should show logo
 */
export function shouldShowFooterLogo(config: SiteConfig | null): boolean {
	return config?.footer?.showLogo !== false // Default to true
}

/**
 * Check if footer should show site name
 */
export function shouldShowFooterSiteName(config: SiteConfig | null): boolean {
	return config?.footer?.showSiteName !== false // Default to true
}

/**
 * Check if footer should show social links
 */
export function shouldShowFooterSocialLinks(config: SiteConfig | null): boolean {
	return config?.footer?.showSocialLinks !== false // Default to true
}

/**
 * Check if footer should show back to top button
 */
export function shouldShowBackToTop(config: SiteConfig | null): boolean {
	return config?.footer?.showBackToTop !== false // Default to true
}

/**
 * Get footer custom text
 */
export function getFooterCustomText(config: SiteConfig | null): string | null {
	return config?.footer?.customFooterText || defaultSiteConfig.footer?.customFooterText || null
}

/**
 * Get visible social profiles for footer
 */
export function getVisibleSocialProfiles(config: SiteConfig) {
	return config.socialProfiles?.filter((profile) => profile.showInFooter !== false) || []
}

/**
 * Generate robots.txt content based on configuration
 */
export function generateRobotsTxt(config: SiteConfig): string {
	const allowIndexing = config.robotsSettings?.allowIndexing !== false
	const customRobots = config.robotsSettings?.customRobotsTxt

	if (customRobots) {
		return customRobots
	}

	const baseRobots = `User-agent: *
${allowIndexing ? "Allow: /" : "Disallow: /"}

Sitemap: ${config.siteUrl}/sitemap.xml`

	return baseRobots
}
