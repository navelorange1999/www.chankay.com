import { Navbar as NavbarUI } from "@repo/ui"
import { SiteConfig } from "@repo/typescript-config/typings/payload-types"

import { normalizeSiteConfigLogo } from "@/utils/normalizeSiteConfigLogo"

export interface NavbarProps {
	siteConfig: SiteConfig
}

export const Navbar = ({ siteConfig }: NavbarProps) => {
	return <NavbarUI siteConfig={normalizeSiteConfigLogo(siteConfig)} />
}
