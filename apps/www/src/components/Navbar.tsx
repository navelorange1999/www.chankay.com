import { Navbar as NavbarUI } from "@repo/ui"
import { SiteConfig } from "@repo/typescript-config/typings/payload-types"

import { payloadClient } from "../utils/payloadClient"

export const Navbar = async () => {
	const siteConfig = await payloadClient.getGlobal<SiteConfig>("site-config")

	return <NavbarUI siteConfig={siteConfig} />
}
