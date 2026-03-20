import { WebsiteLogo } from "@/components/WebsiteLogo"
import { SiteConfig } from "@repo/typescript-config/typings/payload-types"
import { Footer as FooterUI } from "@repo/ui/components/Footer"

export interface FooterProps {
	siteConfig: SiteConfig
}

export function Footer({ siteConfig }: FooterProps) {
	return (
		<FooterUI
			siteConfig={siteConfig}
			fallbackLogo={<WebsiteLogo className="h-8 w-8 text-foreground" />}
		/>
	)
}
