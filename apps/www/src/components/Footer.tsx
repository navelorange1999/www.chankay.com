import { payloadClient } from "@/utils/payloadClient"
import { WebsiteLogo } from "@/components/WebsiteLogo"
import { SiteConfig } from "@repo/typescript-config/typings/payload-types"
import { Footer as FooterUI } from "@repo/ui"

export const Footer = async () => {
	const siteConfig = await payloadClient.getGlobal<SiteConfig>("site-config")

	return (
		<FooterUI
			siteConfig={siteConfig}
			fallbackLogo={<WebsiteLogo className="h-8 w-8 text-foreground" />}
		/>
	)
}
