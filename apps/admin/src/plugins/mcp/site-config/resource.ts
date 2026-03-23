import { getPayloadInstance } from "../shared"

export const siteConfigResourceUri = "site-config://current"

export const siteConfigResource = {
	description: "The current global site configuration document.",
	handler: async () => {
		const payload = await getPayloadInstance()
		const siteConfig = await payload.findGlobal({
			overrideAccess: true,
			slug: "site-config",
		})

		return {
			contents: [
				{
					mimeType: "application/json",
					text: JSON.stringify(siteConfig, null, 2),
					uri: siteConfigResourceUri,
				},
			],
		}
	},
	mimeType: "application/json",
	name: "site_config",
	title: "Site Config",
	uri: siteConfigResourceUri,
}
