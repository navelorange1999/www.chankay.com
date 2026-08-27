import { z } from "zod"
import type { PayloadRequest } from "payload"

import { createTextResult, resolveSupportedLocale } from "../shared"

type LocalizedLinkItem = {
	id?: string | null
	label: unknown
	url: string
	[key: string]: unknown
}

type LinkLabelTranslation = {
	label: string
	url: string
}

const linkLabelTranslationSchema = z.object({
	label: z.string().trim().min(1),
	url: z.string().trim().min(1),
})

const parameters = {
	footerLinkLabels: z.array(linkLabelTranslationSchema).optional(),
	locale: z.string().trim().min(1),
	navigationLabels: z.array(linkLabelTranslationSchema).optional(),
}

const inputSchema = z
	.object(parameters)
	.refine(
		(value) =>
			(value.navigationLabels?.length ?? 0) > 0 || (value.footerLinkLabels?.length ?? 0) > 0,
		{
			message: "At least one navigation or footer link label translation is required.",
		}
	)

export const prepareLinkLabelsForLocale = ({
	fieldName,
	items,
	translations,
}: {
	fieldName: string
	items: LocalizedLinkItem[] | null | undefined
	translations: LinkLabelTranslation[]
}) => {
	const translationsByUrl = new Map<string, string>()

	for (const translation of translations) {
		if (translationsByUrl.has(translation.url)) {
			throw new Error(`Duplicate translation URL "${translation.url}" in ${fieldName}.`)
		}

		translationsByUrl.set(translation.url, translation.label)
	}

	for (const url of translationsByUrl.keys()) {
		const matchCount = (items ?? []).filter((item) => item.url === url).length

		if (matchCount !== 1) {
			throw new Error(
				`Expected exactly one ${fieldName} item for URL "${url}", found ${matchCount}.`
			)
		}
	}

	const missingUrls = (items ?? [])
		.filter((item) => !translationsByUrl.has(item.url))
		.map((item) => `"${item.url}"`)

	if (missingUrls.length > 0) {
		throw new Error(`Missing translations for ${fieldName} URLs: ${missingUrls.join(", ")}.`)
	}

	return (items ?? []).map((item) => {
		return {
			...item,
			label: translationsByUrl.get(item.url),
		}
	})
}

export const translateSiteConfigLabelsTool = {
	description:
		"Translate SiteConfig navigation and footer link labels by URL while preserving shared array items and other locales.",
	handler: async (args: Record<string, unknown>, req: PayloadRequest) => {
		const input = inputSchema.parse(args)
		const locale = resolveSupportedLocale(input.locale)

		if (!locale) {
			throw new Error(`Unsupported locale "${input.locale}".`)
		}

		const payload = req.payload
		const siteConfig = (await payload.findGlobal({
			locale: "all",
			overrideAccess: false,
			req,
			slug: "site-config",
			user: req.user,
		})) as {
			footer?: Record<string, unknown> & {
				additionalLinks?: LocalizedLinkItem[] | null
			}
			navigation?: Record<string, unknown> & {
				menuItems?: LocalizedLinkItem[] | null
			}
		}

		const data: Record<string, unknown> = {}

		if (input.navigationLabels?.length) {
			data.navigation = {
				menuItems: prepareLinkLabelsForLocale({
					fieldName: "navigation.menuItems",
					items: siteConfig.navigation?.menuItems,
					translations: input.navigationLabels,
				}),
			}
		}

		if (input.footerLinkLabels?.length) {
			data.footer = {
				additionalLinks: prepareLinkLabelsForLocale({
					fieldName: "footer.additionalLinks",
					items: siteConfig.footer?.additionalLinks,
					translations: input.footerLinkLabels,
				}),
			}
		}

		await payload.updateGlobal({
			data,
			locale,
			overrideAccess: false,
			req,
			slug: "site-config",
			user: req.user,
		})

		return createTextResult({
			action: "translate_site_config_labels",
			footerLinkLabels: input.footerLinkLabels ?? [],
			locale,
			navigationLabels: input.navigationLabels ?? [],
		})
	},
	name: "translate_site_config_labels",
	parameters,
}
