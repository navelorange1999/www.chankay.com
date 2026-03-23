import type { Page } from "@repo/typescript-config/typings/payload-types"
import { z } from "zod"

import { createTextResult, getPayloadInstance } from "../shared"
import { findPageByIdentifier, summarizePage } from "./shared"

export const publishPageTool = {
	description: "Publish an existing page by id or slug without exposing the generic update tool.",
	handler: async (args: Record<string, unknown>) => {
		const existingPage = await findPageByIdentifier({
			id: typeof args.id === "string" ? args.id : undefined,
			slug: typeof args.slug === "string" ? args.slug : undefined,
		})
		const payload = await getPayloadInstance()
		const updatedPage = (await payload.update({
			collection: "pages",
			data: {
				status: "published",
			},
			id: existingPage.id,
			overrideAccess: true,
		})) as Page

		return createTextResult({
			action: "publish_page",
			page: summarizePage(updatedPage),
		})
	},
	name: "publish_page",
	parameters: {
		id: z.string().optional(),
		slug: z.string().optional(),
	},
}
