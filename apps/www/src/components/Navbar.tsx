import { Navbar as NavbarUI } from "@repo/ui"
import { NavbarInterface } from "@repo/typescript-config/typings/payload-types"

import { payloadClient } from "../utils/payloadClient"

export const Navbar = async () => {
	const globalNavbar = await payloadClient.getGlobal<NavbarInterface>("navbar")

	return <NavbarUI {...globalNavbar?.props} />
}
