import { MediaInterface, SiteConfig } from "@repo/typescript-config/typings/payload-types"

const defaultLogo: MediaInterface = {
	id: "default-favicon",
	alt: "Site logo",
	updatedAt: "",
	createdAt: "",
	url: "/favicon/android-chrome-192x192.png",
	thumbnailURL: "/favicon/android-chrome-192x192.png",
	width: 32,
	height: 32,
}

export const normalizeSiteConfigLogo = (siteConfig: SiteConfig): SiteConfig => {
	const normalizedLogo =
		siteConfig.logo && typeof siteConfig.logo === "object" ? siteConfig.logo : defaultLogo

	return {
		...siteConfig,
		logo: normalizedLogo,
	}
}
