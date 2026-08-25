import type { SiteConfig } from "@repo/typescript-config/typings/payload-types"
import { z } from "zod"

import { SUPPORTED_LOCALES } from "@/config/locales"

import { createTextResult, getPayloadInstance, resolveSupportedLocale } from "../shared"

const siteConfigPatchSchema = z
	.object({})
	.catchall(z.unknown())
	.refine((data) => Object.keys(data).length > 0, "data must be a non-empty JSON object")

const requireSiteConfigPatch = (value: unknown): Record<string, unknown> => {
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		throw new Error("data must be a non-empty JSON object")
	}

	const data = value as Record<string, unknown>
	if (Object.keys(data).length === 0) {
		throw new Error("data must be a non-empty JSON object")
	}

	return data
}

export const updateSiteConfigTool = {
	description: "Update the global site configuration document for a specific locale.",
	handler: async (args: Record<string, unknown>) => {
		const locale = resolveSupportedLocale(args.locale)
		if (!locale) {
			throw new Error(`locale must be one of: ${SUPPORTED_LOCALES.join(", ")}`)
		}

		const data = requireSiteConfigPatch(args.data)
		const payload = await getPayloadInstance()
		const siteConfig = (await payload.updateGlobal({
			data: data as Partial<SiteConfig>,
			locale,
			overrideAccess: true,
			slug: "site-config",
		})) as SiteConfig

		return createTextResult({
			action: "update_site_config",
			locale,
			siteConfig,
		})
	},
	name: "update_site_config",
	parameters: {
		data: siteConfigPatchSchema,
		locale: z.string().min(1),
	},
}
