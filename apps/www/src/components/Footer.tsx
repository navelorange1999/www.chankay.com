import { resolveLocalizedPath, type SupportedLocale, type UiStrings } from "@repo/i18n"
import { Footer as FooterUI } from "@repo/ui/components/Footer"
import { SiteConfig } from "@repo/typescript-config/typings/payload-types"

import { WebsiteLogo } from "@/components/WebsiteLogo"

export interface FooterProps {
	siteConfig: SiteConfig
	currentLocale: SupportedLocale
	strings: UiStrings
}

function isInternalUrl(url: string | undefined | null): url is string {
	return typeof url === "string" && url.startsWith("/") && !url.startsWith("//")
}

function localizeSiteConfigForFooter(siteConfig: SiteConfig, locale: SupportedLocale): SiteConfig {
	const additionalLinks = siteConfig.footer?.additionalLinks
	if (!additionalLinks?.length) {
		return siteConfig
	}

	const localizedLinks = additionalLinks.map((link) => {
		if (link.external || !isInternalUrl(link.url)) {
			return link
		}
		return { ...link, url: resolveLocalizedPath(locale, link.url) }
	})

	return {
		...siteConfig,
		footer: {
			...siteConfig.footer,
			additionalLinks: localizedLinks,
		},
	}
}

export function Footer({ siteConfig, currentLocale, strings }: FooterProps) {
	const localizedSiteConfig = localizeSiteConfigForFooter(siteConfig, currentLocale)

	return (
		<FooterUI
			siteConfig={localizedSiteConfig}
			accessibilityLabels={{
				followOn: strings.accessibility.followOn,
				logo: strings.accessibility.websiteLogo,
			}}
			fallbackLogo={
				<WebsiteLogo
					title={strings.accessibility.websiteLogo}
					className="h-8 w-8 text-foreground"
				/>
			}
		/>
	)
}
