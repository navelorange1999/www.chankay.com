import type { Page } from "@repo/typescript-config/typings/payload-types"
import { z } from "zod"

import { createTextResult, getPayloadInstance, requireStringArg } from "../shared"
import { summarizePage } from "./shared"
import { convertPageStructure, countPageStructureNodes, pageStructureNodeSchema } from "./structure"

const pageSeoSchema = z.object({
	autoGenerateOgImage: z.boolean().optional(),
	metaDescription: z.string().optional(),
	metaTitle: z.string().optional(),
	waitForMs: z.number().int().min(0).optional(),
})

export const createPageDraftTool = {
	description: "Create a page draft using a narrow page schema instead of raw Payload block data.",
	handler: async (args: Record<string, unknown>) => {
		const payload = await getPayloadInstance()
		const title = requireStringArg(args.title, "title")
		const slug = requireStringArg(args.slug, "slug")
		const structure = Array.isArray(args.structure)
			? convertPageStructure(args.structure as Parameters<typeof convertPageStructure>[0])
			: undefined
		const seo = typeof args.seo === "object" && args.seo !== null ? args.seo : undefined

		const createdPage = (await payload.create({
			collection: "pages",
			data: {
				seo,
				slug,
				status: "draft",
				structure,
				title,
			},
			overrideAccess: true,
		})) as Page

		return createTextResult({
			action: "create_page_draft",
			page: summarizePage(createdPage),
			structureNodeCount: Array.isArray(args.structure)
				? countPageStructureNodes(args.structure as Parameters<typeof countPageStructureNodes>[0])
				: 0,
		})
	},
	name: "create_page_draft",
	parameters: {
		seo: pageSeoSchema.optional(),
		slug: z.string().min(1),
		structure: z.array(pageStructureNodeSchema).optional(),
		title: z.string().min(1),
	},
}
