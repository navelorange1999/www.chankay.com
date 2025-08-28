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
