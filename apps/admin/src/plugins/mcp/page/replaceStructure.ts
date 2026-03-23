import type { Page } from "@repo/typescript-config/typings/payload-types"
import { z } from "zod"

import { createTextResult, getPayloadInstance } from "../shared"
import { findPageByIdentifier, summarizePage } from "./shared"
import { convertPageStructure, countPageStructureNodes, pageStructureNodeSchema } from "./structure"

export const replacePageStructureTool = {
	description:
		"Replace the full page structure using a validated V1 schema for container, flex, grid, text, and markdown blocks.",
	handler: async (args: Record<string, unknown>) => {
		const existingPage = await findPageByIdentifier({
			id: typeof args.id === "string" ? args.id : undefined,
			slug: typeof args.slug === "string" ? args.slug : undefined,
		})
		const payload = await getPayloadInstance()
		const inputStructure = args.structure as Parameters<typeof convertPageStructure>[0]
		const updatedPage = (await payload.update({
			collection: "pages",
			data: {
				structure: convertPageStructure(inputStructure),
			},
			id: existingPage.id,
			overrideAccess: true,
		})) as Page

		return createTextResult({
			action: "replace_page_structure",
			page: summarizePage(updatedPage),
			structureNodeCount: countPageStructureNodes(inputStructure),
		})
	},
	name: "replace_page_structure",
	parameters: {
		id: z.string().optional(),
		slug: z.string().optional(),
		structure: z.array(pageStructureNodeSchema).min(1),
	},
}
