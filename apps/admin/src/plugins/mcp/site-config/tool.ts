import { z } from "zod"

import { createTextResult, getPayloadInstance, resolveGlobalLocale } from "../shared"

export const getSiteConfigTool = {
	description: "Read the global site configuration document, optionally for a specific locale.",
	handler: async (args: Record<string, unknown>) => {
		const payload = await getPayloadInstance()
		const locale = resolveGlobalLocale(args.locale)
		const siteConfig = await payload.findGlobal({
			locale,
			overrideAccess: true,
			slug: "site-config",
		})

		return createTextResult({
			locale: locale ?? "default",
			siteConfig,
		})
	},
	name: "get_site_config",
	parameters: {
		locale: z.string().optional(),
	},
}
