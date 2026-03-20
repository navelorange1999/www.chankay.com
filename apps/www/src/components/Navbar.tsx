import { Navbar as NavbarUI } from "@repo/ui/components/Navbar"
import { SiteConfig } from "@repo/typescript-config/typings/payload-types"

import { WebsiteLogo } from "@/components/WebsiteLogo"

export interface NavbarProps {
	siteConfig: SiteConfig
}

export const Navbar = ({ siteConfig }: NavbarProps) => {
	return (
		<NavbarUI
			siteConfig={siteConfig}
			fallbackLogo={<WebsiteLogo className="h-8 w-8 text-foreground" />}
		/>
	)
}
