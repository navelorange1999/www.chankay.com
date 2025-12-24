import { Navbar as NavbarUI } from "@repo/ui"
import { SiteConfig } from "@repo/typescript-config/typings/payload-types"

export interface NavbarProps {
	siteConfig: SiteConfig
}

export const Navbar = ({ siteConfig }: NavbarProps) => {
	return <NavbarUI siteConfig={siteConfig} />
}
