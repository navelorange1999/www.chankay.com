import { resolveLocalizedPath, type SupportedLocale, type UiStrings } from "@repo/i18n"
import { Navbar as NavbarUI } from "@repo/ui/components/Navbar"
import { SiteConfig } from "@repo/typescript-config/typings/payload-types"

import { WebsiteLogo } from "@/components/WebsiteLogo"

export interface NavbarProps {
	siteConfig: SiteConfig
	currentLocale: SupportedLocale
	strings: UiStrings
}

function isInternalUrl(url: string | undefined | null): url is string {
	return typeof url === "string" && url.startsWith("/") && !url.startsWith("//")
}

function localizeSiteConfigForNav(siteConfig: SiteConfig, locale: SupportedLocale): SiteConfig {
	const menuItems = siteConfig.navigation?.menuItems
	if (!menuItems?.length) {
		return siteConfig
	}

	const localizedMenuItems = menuItems.map((item) => {
		if (item.external || !isInternalUrl(item.url)) {
			return item
		}
		return { ...item, url: resolveLocalizedPath(locale, item.url) }
	})

	return {
		...siteConfig,
		navigation: {
			...siteConfig.navigation,
			menuItems: localizedMenuItems,
		},
	}
}

export const Navbar = ({ siteConfig, currentLocale, strings }: NavbarProps) => {
	const localizedSiteConfig = localizeSiteConfigForNav(siteConfig, currentLocale)
	const homeHref = resolveLocalizedPath(currentLocale, "/")

	return (
		<NavbarUI
			siteConfig={localizedSiteConfig}
			homeHref={homeHref}
			currentLocale={currentLocale}
			homeLabel={strings.accessibility.home}
			fallbackLogo={
				<WebsiteLogo
					title={strings.accessibility.websiteLogo}
					className="h-8 w-8 text-foreground"
				/>
			}
		/>
	)
}
