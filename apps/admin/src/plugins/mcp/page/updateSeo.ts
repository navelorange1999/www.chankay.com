import type { Page } from "@repo/typescript-config/typings/payload-types"
import { z } from "zod"

import { createTextResult, getPayloadInstance } from "../shared"
import { findPageByIdentifier, summarizePage } from "./shared"

const pageSeoSchema = z.object({
	autoGenerateOgImage: z.boolean().optional(),
	metaDescription: z.string().optional(),
	metaTitle: z.string().optional(),
	waitForMs: z.number().int().min(0).optional(),
})

export const updatePageSeoTool = {
	description: "Update page SEO fields without exposing the generic page update operation.",
	handler: async (args: Record<string, unknown>) => {
		const existingPage = await findPageByIdentifier({
			id: typeof args.id === "string" ? args.id : undefined,
			slug: typeof args.slug === "string" ? args.slug : undefined,
		})
		const payload = await getPayloadInstance()
		const seoInput =
			typeof args.seo === "object" && args.seo !== null
				? (args.seo as Record<string, unknown>)
				: undefined
		const updatedPage = (await payload.update({
			collection: "pages",
			data: {
				seo: {
					...existingPage.seo,
					autoGenerateOgImage:
						typeof seoInput?.autoGenerateOgImage === "boolean"
							? seoInput.autoGenerateOgImage
							: existingPage.seo?.autoGenerateOgImage,
					metaDescription:
						typeof seoInput?.metaDescription === "string"
							? seoInput.metaDescription
							: existingPage.seo?.metaDescription,
					metaTitle:
						typeof seoInput?.metaTitle === "string"
							? seoInput.metaTitle
							: existingPage.seo?.metaTitle,
					waitForMs:
						typeof seoInput?.waitForMs === "number"
							? seoInput.waitForMs
							: existingPage.seo?.waitForMs,
				},
			},
			id: existingPage.id,
			overrideAccess: true,
		})) as Page

		return createTextResult({
			action: "update_page_seo",
			page: summarizePage(updatedPage),
			seo: updatedPage.seo,
		})
	},
	name: "update_page_seo",
	parameters: {
		id: z.string().optional(),
		seo: pageSeoSchema,
		slug: z.string().optional(),
	},
}
