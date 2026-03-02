import { payloadClient } from "@/utils/payloadClient"
import { normalizeSiteConfigLogo } from "@/utils/normalizeSiteConfigLogo"
import { SiteConfig } from "@repo/typescript-config/typings/payload-types"
import { Footer as FooterUI } from "@repo/ui"

export const Footer = async () => {
	const siteConfig = await payloadClient.getGlobal<SiteConfig>("site-config")

	return <FooterUI siteConfig={normalizeSiteConfigLogo(siteConfig)} />
}
